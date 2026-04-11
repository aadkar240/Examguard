import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Evaluate a student's answer using AI
 * @param {Object} params - Parameters for evaluation
 * @param {string} params.questionText - The question asked
 * @param {string} params.questionType - Type of question (subjective, etc)
 * @param {string} params.correctAnswer - Expected/model answer (if available)
 * @param {string} params.studentAnswer - The student's response
 * @param {number} params.maxMarks - Maximum marks for the question
 * @returns {Object} - { marksObtained, feedback, reasoning }
 */
export async function evaluateAnswer({ 
  questionText, 
  questionType, 
  correctAnswer, 
  studentAnswer, 
  maxMarks 
}) {
  try {
    console.log('\\n🔧 AI Grading Service Called');
    console.log(`  Question Type: ${questionType}`);
    console.log(`  Max Marks: ${maxMarks}`);
    console.log(`  Question: "${questionText?.substring(0, 80)}..."`);
    console.log(`  Expected Answer: "${correctAnswer?.substring(0, 80)}..."`);
    console.log(`  Student Answer: "${studentAnswer?.substring(0, 80)}..."`);
    
    // Skip if no answer provided
    if (!studentAnswer || studentAnswer.trim() === '') {
      console.log('  ⚠️ No student answer provided');
      return {
        marksObtained: 0,
        feedback: 'No answer provided',
        reasoning: 'Student did not attempt this question',
        aiDetectionScore: 0,
        plagiarismFlags: []
      };
    }

    // Skip if auto-graded type
    if (questionType === 'mcq' || questionType === 'true-false') {
      console.log('  ⏭️ Skipping - auto-graded question type');
      return null;
    }
    
    console.log('  🚀 Calling Groq API...');

    const prompt = `You are an experienced examiner evaluating student answers with advanced plagiarism detection capabilities. Analyze the answer thoroughly and fairly.

QUESTION:
${questionText}

${correctAnswer && correctAnswer.trim() !== '' ? `EXPECTED/MODEL ANSWER:\n${correctAnswer}\n` : `NOTE: No model answer provided. Grade based on:\n- Correctness and accuracy of the information\n- Depth of understanding demonstrated\n- Completeness of coverage\n- Quality of explanation\n`}

STUDENT'S ANSWER:
${studentAnswer}

MAXIMUM MARKS: ${maxMarks}

EVALUATION CRITERIA (Analyze each aspect carefully):

1. CONTENT QUALITY (40% weight):
   - Correctness and accuracy of information
   - Depth of understanding demonstrated
   - Use of relevant examples/explanations
   - Technical accuracy

2. ORIGINALITY & AUTHENTICITY (30% weight):
   - Does the answer appear to be in the student's own words?
   - Red flags for AI/chatbot-generated content:
     * Overly formal or robotic language
     * Perfect grammar with no natural errors
     * Generic phrases like "It's important to note", "In conclusion", "Furthermore"
     * Overly structured responses (numbered lists, perfect paragraphs)
     * Lack of personal examples or context
     * Wikipedia-style or textbook-perfect language
   - If detected as likely AI/chatbot-generated: REDUCE marks by 30-50%

3. COMPLETENESS (15% weight):
   - Coverage of all key points
   - Addressing all parts of the question
   - Appropriate length and detail

4. CLARITY & EXPRESSION (15% weight):
   - Clear communication of ideas
   - Logical flow (but not too perfect)
   - Appropriate terminology
   - Natural writing style (expected from students)

PLAGIARISM DETECTION:
- Check for signs of copy-paste from ChatGPT, Bard, or other AI tools
- Genuine student answers often have:
  * Minor grammatical imperfections
  * Casual language mixed with technical terms
  * Personal examples or analogies
  * Incomplete or slightly messy structure
- AI-generated answers often have:
  * Perfect structure and flow
  * Overuse of transition words
  * Generic, textbook-style explanations
  * No spelling errors (suspicious for handwritten/timed exams)

PENALTY GUIDELINES:
- Clear AI-generated content: Deduct 40-60% of marks
- Partially copied with some own words: Deduct 20-30% of marks
- Suspiciously perfect but unclear: Deduct 10-20% of marks
- Genuine student answer (even if imperfect): Full credit based on correctness

Provide your evaluation in the following JSON format:
{
  "marksObtained": <number between 0 and ${maxMarks}>,
  "feedback": "<constructive feedback including any plagiarism concerns>",
  "reasoning": "<detailed reasoning including authenticity assessment>",
  "aiDetectionScore": <number 0-100, where 100 = definitely AI-generated, 0 = definitely human>,
  "plagiarismFlags": ["<list of specific indicators found, if any>"]
}

Be thorough and fair. Reward genuine effort even if imperfect. Penalize obvious copying/AI use. Only return valid JSON, no additional text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert examiner with advanced plagiarism detection capabilities. You evaluate answers fairly while detecting AI-generated or copied content. You understand the difference between genuine student writing (with natural imperfections) and AI-generated responses (too perfect, generic). Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    console.log('  ✅ Groq API response received');
    console.log('  📦 Raw response:', completion.choices[0].message.content);

    const result = JSON.parse(completion.choices[0].message.content);
    console.log('  📊 Parsed result:', JSON.stringify(result, null, 2));

    // Validate and constrain marks
    let marksObtained = parseFloat(result.marksObtained) || 0;
    marksObtained = Math.max(0, Math.min(marksObtained, maxMarks));
    
    console.log(`  🎯 Marks: ${marksObtained}/${maxMarks}`);
    console.log(`  🔍 AI Detection Score: ${result.aiDetectionScore || 0}`);

    // Add plagiarism warning to feedback if detected
    const aiDetectionScore = result.aiDetectionScore || 0;
    let finalFeedback = result.feedback || 'Evaluated by AI';
    
    if (aiDetectionScore >= 70) {
      finalFeedback = `⚠️ HIGH PLAGIARISM RISK: This answer shows strong signs of AI-generated content. Marks reduced accordingly. ${finalFeedback}`;
    } else if (aiDetectionScore >= 50) {
      finalFeedback = `⚠️ MODERATE PLAGIARISM RISK: Some indicators of copied/AI content detected. ${finalFeedback}`;
    } else if (aiDetectionScore >= 30) {
      finalFeedback = `ℹ️ MINOR CONCERNS: Answer appears mostly genuine with minor concerns. ${finalFeedback}`;
    }

    const finalResult = {
      marksObtained,
      feedback: finalFeedback,
      reasoning: result.reasoning || '',
      aiDetectionScore: aiDetectionScore,
      plagiarismFlags: result.plagiarismFlags || []
    };
    
    console.log('  🎉 Final Result:', JSON.stringify(finalResult, null, 2));
    console.log('  ✅ AI Grading Service Complete\\n');

    return finalResult;
  } catch (error) {
    console.error('❌ AI grading error:', error);
    console.error('  Error details:', error.message);
    console.error('  Stack:', error.stack);
    throw new Error('Failed to evaluate answer using AI: ' + error.message);
  }
}

/**
 * Evaluate multiple answers in batch
 * @param {Array} answers - Array of answer objects to evaluate
 * @returns {Array} - Array of evaluation results
 */
export async function evaluateAnswersBatch(answers) {
  const results = [];
  
  for (const answer of answers) {
    try {
      const result = await evaluateAnswer(answer);
      results.push({
        ...result,
        questionNumber: answer.questionNumber,
        success: true
      });
    } catch (error) {
      results.push({
        questionNumber: answer.questionNumber,
        success: false,
        error: error.message,
        marksObtained: 0,
        feedback: 'AI evaluation failed'
      });
    }
  }
  
  return results;
}

export default { evaluateAnswer, evaluateAnswersBatch };
