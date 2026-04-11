import Groq from 'groq-sdk';

const sanitizeJsonString = (content = '') => {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1].trim() : trimmed;
};

const normalizeQuestionType = (type = '') => {
  const value = String(type).toLowerCase();
  if (value.includes('mcq') || value.includes('multiple')) return 'mcq';
  if (value.includes('true') || value.includes('false')) return 'true-false';
  return 'subjective';
};

const countKeywordHits = (text = '', keywords = []) => {
  const normalizedText = String(text).toLowerCase();
  return keywords.reduce((count, keyword) => {
    return normalizedText.includes(keyword) ? count + 1 : count;
  }, 0);
};

const hasMultipleSubquestions = (questionText = '') => {
  const text = String(questionText || '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const linePattern = /^(?:\(?\d+\)|\d+[.)]|\([a-z]\)|[a-z][.)]|\([ivxlcdm]+\)|[ivxlcdm]+[.)])\s+/i;
  const lineMatches = lines.filter((line) => linePattern.test(line)).length;
  if (lineMatches >= 2) return true;

  const inlinePattern = /(?:\([a-z]\)|\([ivxlcdm]+\)|\(\d+\)|\b[a-z][.)]|\b\d+[.)])\s+/gi;
  const inlineMatches = text.match(inlinePattern)?.length || 0;
  return inlineMatches >= 2;
};

const getSubjectiveLengthBand = (rawType = '', questionText = '') => {
  const typeValue = String(rawType).toLowerCase();
  if (typeValue.includes('short')) return 'short';
  if (typeValue.includes('long') || typeValue.includes('essay') || typeValue.includes('descriptive')) return 'long';

  const wordCount = String(questionText || '').trim().split(/\s+/).filter(Boolean).length;
  return wordCount <= 18 ? 'short' : 'long';
};

const assignMarksByRule = ({ rawType = '', normalizedType = 'subjective', questionText = '' }) => {
  if (hasMultipleSubquestions(questionText)) {
    return 10;
  }

  const complexityKeywords = [
    'explain',
    'analyze',
    'compare',
    'justify',
    'derive',
    'evaluate',
    'critically',
    'architecture',
    'algorithm',
    'design',
    'discussion'
  ];
  const complexityHits = countKeywordHits(questionText, complexityKeywords);
  const textLength = String(questionText || '').trim().length;

  if (normalizedType === 'mcq' || normalizedType === 'true-false') {
    return complexityHits >= 2 || textLength > 110 ? 2 : 1;
  }

  const subjectiveBand = getSubjectiveLengthBand(rawType, questionText);
  if (subjectiveBand === 'short') {
    return complexityHits >= 2 || textLength > 130 ? 5 : 4;
  }

  return complexityHits >= 2 || textLength > 180 ? 8 : 7;
};

const normalizeQuestions = (questions = []) => {
  return questions
    .filter((question) => question && question.question_text)
    .map((question, index) => {
      const questionType = normalizeQuestionType(question.question_type);
      const marks = assignMarksByRule({
        rawType: question.question_type,
        normalizedType: questionType,
        questionText: question.question_text
      });
      const normalized = {
        question_text: String(question.question_text).trim(),
        question_type: questionType,
        marks,
        explanation: String(question.explanation || '').trim()
      };

      if (questionType === 'mcq') {
        const options = Array.isArray(question.options)
          ? question.options.map((option) => String(option).trim()).filter(Boolean)
          : [];
        normalized.options = options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'];
        normalized.correct_answer = String(
          question.correct_answer || normalized.options[0]
        ).trim();
      } else if (questionType === 'true-false') {
        const answer = String(question.correct_answer || 'True').trim();
        normalized.correct_answer = answer.toLowerCase() === 'false' ? 'False' : 'True';
      } else {
        normalized.correct_answer = String(question.correct_answer || '').trim();
      }

      return {
        ...normalized,
        question_number: index + 1
      };
    });
};

export const generateExamWithAI = async ({
  subject,
  topics,
  total_marks,
  duration,
  exam_type,
  difficulty_distribution,
  marks_structure,
  additional_instructions
}) => {
  const groqApiKey = String(process.env.GROQ_API_KEY || '').trim();

  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server');
  }

  const groq = new Groq({ apiKey: groqApiKey });

  const prompt = `Generate a complete exam paper as strict JSON.

Subject: ${subject}
Topics: ${Array.isArray(topics) ? topics.join(', ') : topics}
Total Marks: ${total_marks}
Duration (minutes): ${duration}
Exam Type: ${exam_type}
Difficulty Distribution (%): Easy ${difficulty_distribution?.easy || 0}, Medium ${difficulty_distribution?.medium || 0}, Hard ${difficulty_distribution?.hard || 0}
Marks Structure: MCQ ${marks_structure?.mcq || 0}, Short ${marks_structure?.short || 0}, Long ${marks_structure?.long || 0}
Additional Instructions: ${additional_instructions || 'None'}

Return ONLY valid JSON in this exact shape:
{
  "subject": "string",
  "total_marks": number,
  "duration": number,
  "exam_type": "string",
  "questions": [
    {
      "question_text": "string",
      "question_type": "mcq|subjective|true-false",
      "marks": number,
      "options": ["string"],
      "correct_answer": "string",
      "explanation": "string"
    }
  ]
}

Rules:
1) Questions must be relevant to the subject and topics.
2) Total marks across all questions must equal ${total_marks}.
3) Include options only for MCQ questions.
4) Marking policy per question: MCQ/True-False = 1-2 marks, Short Answer = 4-5 marks, Long Answer = 7-8 marks.
5) If a single question contains 2 or more subquestions (like a/b or i/ii), assign 10 marks to that question.
6) Keep the response as JSON only with no markdown.`;

  let completion;
  try {
    completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam paper setter. Always return strictly valid JSON without markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 1800,
      response_format: { type: 'json_object' }
    });
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('invalid api key') || error?.code === 'invalid_api_key') {
      throw new Error('Invalid GROQ_API_KEY configured on the server');
    }
    throw error;
  }

  const raw = completion?.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(sanitizeJsonString(raw));
  const normalizedQuestions = normalizeQuestions(parsed.questions || []);

  if (!normalizedQuestions.length) {
    throw new Error('AI did not return valid questions');
  }

  const computedTotalMarks = normalizedQuestions.reduce((sum, question) => {
    return sum + (Number(question.marks) || 0);
  }, 0);

  return {
    subject,
    total_marks: computedTotalMarks,
    duration: Number(duration),
    exam_type,
    questions: normalizedQuestions
  };
};
