import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Extract keywords from an answer using Groq API
 * @param {string} answer - The answer text
 * @param {string} question - The question text
 * @returns {Promise<string[]>} - Array of keywords
 */
export const extractKeywords = async (answer, question) => {
  try {
    if (!answer || !String(answer).trim()) {
      return [];
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Extract concise keywords only. Return comma-separated keywords with no extra text.'
        },
        {
          role: 'user',
          content: `Extract the 5-10 most important keywords/concepts from this answer to the question below. Return ONLY keywords separated by commas, nothing else.

Question: ${question}

Answer: ${answer}`
        }
      ],
      temperature: 0.2
    });

    const keywordText = completion?.choices?.[0]?.message?.content || '';
    const keywords = keywordText
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0)
      .slice(0, 12);

    return keywords;
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
};

/**
 * Calculate keyword match score between two sets of keywords
 * @param {string[]} studentKeywords - Keywords from student answer
 * @param {string[]} aiKeywords - Keywords from AI answer
 * @returns {number} - Match score (0-100)
 */
export const calculateKeywordMatchScore = (studentKeywords, aiKeywords) => {
  if (aiKeywords.length === 0) return 0;

  let matchCount = 0;

  // Check for exact matches
  for (const studentKw of studentKeywords) {
    for (const aiKw of aiKeywords) {
      if (studentKw === aiKw) {
        matchCount++;
      }
    }
  }

  // Check for partial matches (keyword contains or is contained in)
  for (const studentKw of studentKeywords) {
    for (const aiKw of aiKeywords) {
      if (matchCount >= aiKeywords.length) break;
      if (studentKw !== aiKw) {
        if (
          studentKw.includes(aiKw) ||
          aiKw.includes(studentKw) ||
          similarityScore(studentKw, aiKw) > 0.7
        ) {
          if (!aiKeywords.includes(studentKw)) {
            matchCount += 0.5; // Half credit for partial match
          }
        }
      }
    }
  }

  // Calculate percentage
  const score = (matchCount / aiKeywords.length) * 100;
  return Math.min(100, Math.round(score));
};

/**
 * Calculate string similarity score (0-1)
 * Uses Levenshtein distance concept
 * @param {string} str1
 * @param {string} str2
 * @returns {number}
 */
const similarityScore = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate edit distance between two strings
 */
const getEditDistance = (s1, s2) => {
  const matrix = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
};

/**
 * Auto-assign marks based on keyword match score
 * Uses a grading formula: marks = (matchScore / 100) * maxMarks
 * @param {number} matchScore - Keyword match score (0-100)
 * @param {number} maxMarks - Maximum marks for the question
 * @returns {number} - Assigned marks
 */
export const calculateAutoMarks = (matchScore, maxMarks) => {
  // Bonus: If student covers all keywords, give bonus marks
  let marks = (matchScore / 100) * maxMarks;

  // Apply scale: Give more credit for good answers
  if (matchScore >= 90) {
    marks = Math.min(maxMarks, marks * 1.05); // 5% bonus for excellent answers
  } else if (matchScore < 40) {
    marks = marks * 0.95; // Slight penalty for very poor answers
  }

  return Math.round(marks * 100) / 100; // Round to 2 decimal places
};

/**
 * Determine if answer requires manual review
 * @param {number} confidenceScore - AI confidence (0-100)
 * @param {number} matchScore - Keyword match score (0-100)
 * @returns {boolean}
 */
export const shouldFlagForManualReview = (confidenceScore, matchScore) => {
  // Flag if:
  // 1. Confidence score is low (< 60%)
  // 2. Match score is borderline (30-60% range)
  // 3. Match score is very low (< 20%)
  return (
    confidenceScore < 60 ||
    (matchScore >= 30 && matchScore <= 60) ||
    matchScore < 20
  );
};

/**
 * Evaluate a subjective answer using AI
 * Compares student answer with AI-generated answer
 * @param {string} studentAnswer - Student's answer
 * @param {string} aiAnswer - AI-generated answer
 * @param {string} question - The question
 * @param {number} maxMarks - Maximum marks
 * @returns {Promise<object>} - Evaluation result
 */
export const evaluateSubjectiveAnswer = async (
  studentAnswer,
  aiAnswer,
  question,
  maxMarks
) => {
  try {
    // Extract keywords from both answers in parallel
    const [studentKeywords, aiKeywords] = await Promise.all([
      extractKeywords(studentAnswer, question),
      extractKeywords(aiAnswer, question)
    ]);

    // Calculate match score
    const matchScore = calculateKeywordMatchScore(studentKeywords, aiKeywords);

    // Determine confidence based on match score
    // Higher match = higher confidence
    let confidenceScore = matchScore;
    if (matchScore > 70) {
      confidenceScore = Math.min(100, matchScore + 10);
    } else if (matchScore < 30) {
      confidenceScore = matchScore * 0.8;
    }

    // Calculate auto-assigned marks
    const autoMarks = calculateAutoMarks(matchScore, maxMarks);

    // Determine if manual review is needed
    const requiresManualReview = shouldFlagForManualReview(
      confidenceScore,
      matchScore
    );

    return {
      studentAnswerKeywords: studentKeywords,
      aiAnswerKeywords: aiKeywords,
      keywordMatchScore: matchScore,
      aiAutoMarks: autoMarks,
      aiConfidenceScore: Math.round(confidenceScore),
      requiresManualReview,
      evaluation: {
        keywordMatches: {
          total: aiKeywords.length,
          found: matchScore >= 50 ? 'Good' : matchScore >= 30 ? 'Partial' : 'Poor',
          percentage: matchScore
        },
        recommendation:
          matchScore >= 70
            ? 'Auto-approve'
            : matchScore >= 40
              ? 'Review recommended'
              : 'Manual review required'
      }
    };
  } catch (error) {
    console.error('Error evaluating subjective answer:', error);
    return {
      error: error.message,
      requiresManualReview: true
    };
  }
};

/**
 * Batch evaluate subjective answers for an exam submission
 * @param {array} answers - Array of answer objects with questionType
 * @param {array} questions - Array of question objects with aiGeneratedAnswer
 * @returns {Promise<array>} - Evaluated answers with marks and flags
 */
export const batchEvaluateSubjectiveAnswers = async (answers, questions) => {
  const evaluatedAnswers = [];

  for (const answer of answers) {
    const question = questions.find(q => q.number === answer.questionNumber);

    if (!question) {
      evaluatedAnswers.push({
        ...answer,
        error: 'Question not found'
      });
      continue;
    }

    // Only evaluate subjective questions
    if (question.type === 'subjective' && question.aiGeneratedAnswer) {
      const evaluation = await evaluateSubjectiveAnswer(
        answer.answer,
        question.aiGeneratedAnswer,
        question.question,
        question.marks
      );

      evaluatedAnswers.push({
        ...answer,
        ...evaluation,
        aiGeneratedAnswer: question.aiGeneratedAnswer
      });
    } else {
      // For non-subjective questions, pass through as-is
      evaluatedAnswers.push(answer);
    }
  }

  return evaluatedAnswers;
};

export default {
  extractKeywords,
  calculateKeywordMatchScore,
  calculateAutoMarks,
  shouldFlagForManualReview,
  evaluateSubjectiveAnswer,
  batchEvaluateSubjectiveAnswers
};
