import Evaluation from '../models/Evaluation.js';
import Exam from '../models/Exam.js';
import Grievance from '../models/Grievance.js';
import { evaluateAnswer as aiEvaluateAnswer, evaluateAnswersBatch } from '../services/aiGradingService.js';

// @desc    Get all evaluations
// @route   GET /api/evaluations
// @access  Private (Faculty/Admin)
export const getEvaluations = async (req, res) => {
  try {
    let query = {};

    // Filter by exam if provided
    if (req.query.examId) {
      query.exam = req.query.examId;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const evaluations = await Evaluation.find(query)
      .populate('student', 'name email studentId')
      .populate('exam', 'title subject')
      .populate('evaluatedBy', 'name')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluations',
      error: error.message
    });
  }
};

// @desc    Get evaluation by ID
// @route   GET /api/evaluations/:id
// @access  Private
export const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('student', 'name email studentId')
      .populate({
        path: 'exam',
        select: 'title subject questions totalMarks'
      })
      .populate('evaluatedBy', 'name')
      .populate('reEvaluationBy', 'name')
      .populate('auditLog.performedBy', 'name');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && evaluation.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this evaluation'
      });
    }

    if (
      req.user.role === 'student' &&
      ['submitted', 'under-evaluation'].includes(evaluation.status)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Checked paper will be available after faculty evaluation is completed'
      });
    }

    res.status(200).json({
      success: true,
      evaluation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluation',
      error: error.message
    });
  }
};

// @desc    Evaluate answer sheet
// @route   PUT /api/evaluations/:id/evaluate
// @access  Private (Faculty/Admin)
export const evaluateAnswer = async (req, res) => {
  try {
    const { answers, feedback } = req.body;
    
    let evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    const exam = await Exam.findById(evaluation.exam).select('createdBy title');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found for this evaluation'
      });
    }

    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to evaluate this answer sheet'
      });
    }

    const previousTotalMarks = evaluation.totalMarks;
    const previousGrade = evaluation.grade;
    const previousPercentage = evaluation.percentage;

    // Calculate total marks
    let totalMarks = 0;
    evaluation.answers = evaluation.answers.map((existingAnswer, index) => {
      const updatedAnswer = answers.find(a => a.questionNumber === existingAnswer.questionNumber);
      if (updatedAnswer) {
        totalMarks += updatedAnswer.marksObtained || 0;
        return {
          ...existingAnswer.toObject(),
          marksObtained: updatedAnswer.marksObtained,
          feedback: updatedAnswer.feedback
        };
      }
      totalMarks += existingAnswer.marksObtained || 0;
      return existingAnswer;
    });

    evaluation.totalMarks = totalMarks;
    const isRecheck = ['evaluated', 're-evaluation-requested', 're-evaluated'].includes(evaluation.status);
    evaluation.status = isRecheck ? 're-evaluated' : 'evaluated';
    evaluation.evaluatedBy = req.user.id;
    evaluation.evaluatedAt = new Date();

    // Add to audit log
    evaluation.auditLog.push({
      action: 'Evaluation completed',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: 'Faculty completed evaluation and assigned marks'
    });

    await evaluation.save();

    if (isRecheck) {
      evaluation.reEvaluationComparison = {
        previousTotalMarks,
        updatedTotalMarks: evaluation.totalMarks,
        previousGrade,
        updatedGrade: evaluation.grade,
        previousPercentage,
        updatedPercentage: evaluation.percentage,
        updatedAt: new Date()
      };
      await evaluation.save();
    }

    const relatedGrievance = await Grievance.findOne({
      relatedEvaluation: evaluation._id,
      status: { $in: ['open', 'in-progress', 'pending-response', 'escalated'] }
    }).sort({ createdAt: -1 });

    if (relatedGrievance) {
      relatedGrievance.status = 'resolved';
      relatedGrievance.evaluationReview = {
        previousTotalMarks,
        updatedTotalMarks: evaluation.totalMarks,
        previousGrade,
        updatedGrade: evaluation.grade,
        previousPercentage,
        updatedPercentage: evaluation.percentage,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        remarks: 'Rechecked in evaluation system from grievance workflow'
      };
      relatedGrievance.resolution = {
        message: 'Evaluation rechecked by faculty and grievance resolved.',
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
        actionTaken: 'Marks updated in evaluation module'
      };
      relatedGrievance.timeline.push({
        action: 'Evaluation rechecked from evaluation module',
        performedBy: req.user.id,
        timestamp: new Date(),
        details: `Marks changed from ${previousTotalMarks} to ${evaluation.totalMarks}`
      });
      await relatedGrievance.save();
    }

    // Notify student via Socket.IO
    const io = req.app.get('io');
    io.to(`user-${evaluation.student}`).emit('evaluation-completed', {
      message: 'Your answer sheet has been evaluated',
      evaluationId: evaluation._id
    });

    if (relatedGrievance) {
      io.to(`user-${evaluation.student}`).emit('grievance-resolved', {
        message: 'Your grievance has been resolved after rechecking',
        grievanceId: relatedGrievance._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation completed successfully',
      evaluation
    });
  } catch (error) {
    console.error('Evaluate answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating answer sheet',
      error: error.message
    });
  }
};

// @desc    Request re-evaluation
// @route   POST /api/evaluations/:id/request-reevaluation
// @access  Private (Student)
export const requestReEvaluation = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed reason (minimum 10 characters)'
      });
    }

    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    // Check if student owns this evaluation
    if (evaluation.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if evaluation is completed
    if (evaluation.status !== 'evaluated') {
      return res.status(400).json({
        success: false,
        message: 'Can only request re-evaluation for completed evaluations'
      });
    }

    // Check if already requested
    if (evaluation.reEvaluationRequested) {
      return res.status(400).json({
        success: false,
        message: 'Re-evaluation already requested for this exam'
      });
    }

    evaluation.reEvaluationRequested = true;
    evaluation.reEvaluationReason = reason;
    evaluation.reEvaluationDate = new Date();
    evaluation.status = 're-evaluation-requested';

    // Add to audit log
    evaluation.auditLog.push({
      action: 'Re-evaluation requested',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: `Student requested re-evaluation: ${reason}`
    });

    await evaluation.save();

    // Notify faculty
    const exam = await Exam.findById(evaluation.exam);
    const io = req.app.get('io');
    io.to(`user-${exam.createdBy}`).emit('reevaluation-requested', {
      message: 'A student has requested re-evaluation',
      evaluationId: evaluation._id
    });

    res.status(200).json({
      success: true,
      message: 'Re-evaluation request submitted successfully',
      evaluation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error requesting re-evaluation',
      error: error.message
    });
  }
};

// @desc    Get my evaluations (for students)
// @route   GET /api/evaluations/my-evaluations
// @access  Private (Student)
export const getMyEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ student: req.user.id })
      .populate('exam', 'title subject examType totalMarks')
      .populate('evaluatedBy', 'name')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your evaluations',
      error: error.message
    });
  }
};

// @desc    Get all submitted exam feedback
// @route   GET /api/evaluations/feedback/list
// @access  Private (Admin)
export const getExamFeedbackList = async (req, res) => {
  try {
    const feedbackEvaluations = await Evaluation.find({
      'examFeedback.submittedAt': { $exists: true }
    })
      .populate('student', 'name email studentId department semester')
      .populate('exam', 'title subject department semesters')
      .sort({ 'examFeedback.submittedAt': -1 });

    const feedback = feedbackEvaluations.map((evaluation) => ({
      _id: evaluation._id,
      student: evaluation.student,
      exam: evaluation.exam,
      feedback: evaluation.examFeedback,
      evaluationStatus: evaluation.status,
      submittedAt: evaluation.submittedAt
    }));

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exam feedback',
      error: error.message
    });
  }
};

// @desc    Get pending evaluations
// @route   GET /api/evaluations/pending/list
// @access  Private (Faculty/Admin)
export const getPendingEvaluations = async (req, res) => {
  try {
    // Get exams created by this faculty
    const exams = await Exam.find({ createdBy: req.user.id });
    const examIds = exams.map(e => e._id);

    // Fetch all evaluations (not just pending) for faculty's exams
    const evaluations = await Evaluation.find({
      exam: { $in: examIds }
    })
      .populate('student', 'name email studentId')
      .populate('exam', 'title subject')
      .sort({ submittedAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      count: evaluations.length,
      evaluations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending evaluations',
      error: error.message
    });
  }
};

// @desc    Auto-grade single evaluation using AI
// @route   POST /api/evaluations/:id/ai-grade
// @access  Private (Faculty/Admin)
export const aiGradeEvaluation = async (req, res) => {
  try {
    console.log('🤖 AI Grade Evaluation called for evaluation ID:', req.params.id);
    
    const evaluation = await Evaluation.findById(req.params.id)
      .populate({
        path: 'exam',
        select: 'title subject questions createdBy'
      });

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    console.log(`📚 Exam: "${evaluation.exam.title}" with ${evaluation.exam.questions.length} questions`);

    // Check if faculty owns this exam
    if (evaluation.exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this evaluation'
      });
    }

    // Allow re-grading even if already evaluated
    console.log(`📝 Current status: ${evaluation.status}. Re-grading allowed.`);

    const exam = evaluation.exam;
    let totalMarks = 0;
    const gradingResults = [];

    // Grade each answer
    for (let i = 0; i < evaluation.answers.length; i++) {
      const answer = evaluation.answers[i];
      const question = exam.questions[i];

      console.log(`🔍 Checking Q${i + 1}: Type=${question.questionType}, Marks=${question.marks}`);

      // Skip if already graded (MCQ/True-False)
      if (question.questionType === 'mcq' || question.questionType === 'true-false') {
        totalMarks += answer.marksObtained || 0;
        console.log(`  ✅ Already graded: ${answer.marksObtained}/${question.marks}`);
        gradingResults.push({
          questionNumber: answer.questionNumber,
          skipped: true,
          reason: 'Already auto-graded'
        });
        continue;
      }

      console.log(`  🤖 AI Grading subjective question...`);
      console.log(`  📝 Question Text: "${question.questionText?.substring(0, 100)}..."`);
      console.log(`  📝 Rubric: ${question.rubric ? `"${question.rubric.substring(0, 100)}..."` : 'NOT SET'}`);
      console.log(`  📝 CorrectAnswer: ${question.correctAnswer ? `"${question.correctAnswer.substring(0, 50)}..."` : 'NOT SET'}`);
      console.log(`  📝 Student answer length: ${answer.answer?.length || 0} chars`);
      console.log(`  📝 Student answer: "${answer.answer?.substring(0, 100)}..."`);
      
      const rubricOrAnswer = question.rubric || question.correctAnswer || '';
      
      if (!rubricOrAnswer || rubricOrAnswer.trim() === '') {
        console.log(`  ℹ️  No rubric provided - AI will grade based on question understanding and quality`);
      } else {
        console.log(`  📋 Using rubric for grading: "${rubricOrAnswer.substring(0, 80)}..."`);
      }

      try {
        console.log(`  🚀 Calling AI grading service...`);
        const aiResult = await aiEvaluateAnswer({
          questionText: question.questionText,
          questionType: question.questionType,
          correctAnswer: rubricOrAnswer,  // Can be empty - AI will evaluate on merit
          studentAnswer: answer.answer,
          maxMarks: question.marks
        });
        console.log(`  ✔️ AI service returned:`, JSON.stringify(aiResult, null, 2));

        if (aiResult) {
          console.log(`  💾 Saving marks to evaluation.answers[${i}]...`);
          console.log(`  📌 Before: marksObtained = ${evaluation.answers[i].marksObtained}`);
          
          evaluation.answers[i].marksObtained = aiResult.marksObtained;
          evaluation.answers[i].feedback = aiResult.feedback;
          evaluation.answers[i].aiDetectionScore = aiResult.aiDetectionScore;
          evaluation.answers[i].plagiarismFlags = aiResult.plagiarismFlags;
          totalMarks += aiResult.marksObtained;
          
          console.log(`  📌 After: marksObtained = ${evaluation.answers[i].marksObtained}`);
          console.log(`  ✅ AI Graded: ${aiResult.marksObtained}/${question.marks} marks`);
          console.log(`  📊 Plagiarism Score: ${aiResult.aiDetectionScore || 0}`);
          console.log(`  💬 Feedback: ${aiResult.feedback?.substring(0, 100)}`);
          
          gradingResults.push({
            questionNumber: answer.questionNumber,
            marksObtained: aiResult.marksObtained,
            feedback: aiResult.feedback,
            aiDetectionScore: aiResult.aiDetectionScore,
            plagiarismFlags: aiResult.plagiarismFlags,
            success: true
          });
        } else {
          console.log(`  ⚠️ AI returned null result`);
          gradingResults.push({
            questionNumber: answer.questionNumber,
            success: false,
            error: 'AI returned null'
          });
        }
      } catch (error) {
        console.error(`AI grading error for question ${i + 1}:`, error);
        gradingResults.push({
          questionNumber: answer.questionNumber,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`\n💾 Saving evaluation to database...`);
    console.log(`📊 Total Marks: ${totalMarks}/${evaluation.maxMarks}`);
    console.log(`📋 Answers array length: ${evaluation.answers.length}`);
    
    evaluation.totalMarks = totalMarks;
    evaluation.status = 'evaluated';
    evaluation.evaluatedBy = req.user.id;
    evaluation.evaluatedAt = new Date();

    evaluation.auditLog.push({
      action: 'AI evaluation completed',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: `Answers evaluated using AI grading system. Total: ${totalMarks}/${evaluation.maxMarks}`
    });

    evaluation.markModified('answers');
    await evaluation.save();

    console.log(`✅ AI Grading Complete and SAVED!`);
    console.log(`📊 Final Total: ${totalMarks}/${evaluation.maxMarks} marks`);
    console.log(`📝 Grading Results Summary:`);
    gradingResults.forEach(r => {
      if (r.success) {
        console.log(`   Q${r.questionNumber}: ${r.marksObtained} marks`);
      } else {
        console.log(`   Q${r.questionNumber}: FAILED - ${r.error}`);
      }
    });

    res.status(200).json({
      success: true,
      message: 'AI grading completed successfully',
      evaluation,
      gradingResults
    });
  } catch (error) {
    console.error('AI grading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during AI grading',
      error: error.message
    });
  }
};

// @desc    Auto-grade multiple evaluations using AI (bulk)
// @route   POST /api/evaluations/bulk/ai-grade
// @access  Private (Faculty/Admin)
export const bulkAiGradeEvaluations = async (req, res) => {
  try {
    const { evaluationIds } = req.body;

    if (!evaluationIds || !Array.isArray(evaluationIds) || evaluationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide evaluation IDs array'
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      details: []
    };

    for (const evalId of evaluationIds) {
      try {
        const evaluation = await Evaluation.findById(evalId)
          .populate({
            path: 'exam',
            select: 'title subject questions createdBy'
          })
          .populate('student', 'name email');

        if (!evaluation) {
          results.failed++;
          results.details.push({
            evaluationId: evalId,
            success: false,
            error: 'Evaluation not found'
          });
          continue;
        }

        // Check authorization
        if (evaluation.exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          results.failed++;
          results.details.push({
            evaluationId: evalId,
            success: false,
            error: 'Not authorized'
          });
          continue;
        }

        // Allow re-grading
        console.log(`🔄 Re-grading evaluation ${evalId}, current status: ${evaluation.status}`);

        const exam = evaluation.exam;
        let totalMarks = 0;

        // Grade each answer
        for (let i = 0; i < evaluation.answers.length; i++) {
          const answer = evaluation.answers[i];
          const question = exam.questions[i];

          // Keep existing marks for auto-graded questions
          if (question.questionType === 'mcq' || question.questionType === 'true-false') {
            totalMarks += answer.marksObtained || 0;
            continue;
          }

          // AI grade subjective questions
          try {
            const aiResult = await aiEvaluateAnswer({
              questionText: question.questionText,
              questionType: question.questionType,
              correctAnswer: question.rubric || question.correctAnswer || '',
              studentAnswer: answer.answer,
              maxMarks: question.marks
            });

            if (aiResult) {
              evaluation.answers[i].marksObtained = aiResult.marksObtained;
              evaluation.answers[i].feedback = aiResult.feedback;
              evaluation.answers[i].aiDetectionScore = aiResult.aiDetectionScore;
              evaluation.answers[i].plagiarismFlags = aiResult.plagiarismFlags;
              totalMarks += aiResult.marksObtained;
            }
          } catch (error) {
            console.error(`AI grading error for question ${i + 1}:`, error);
            // Continue with next question even if one fails
          }
        }

        evaluation.totalMarks = totalMarks;
        evaluation.status = 'evaluated';
        evaluation.evaluatedBy = req.user.id;
        evaluation.evaluatedAt = new Date();

        evaluation.auditLog.push({
          action: 'Bulk AI evaluation completed',
          performedBy: req.user.id,
          timestamp: new Date(),
          details: 'Evaluated as part of bulk AI grading'
        });

        await evaluation.save();

        results.successful++;
        results.details.push({
          evaluationId: evalId,
          studentName: evaluation.student.name,
          examTitle: exam.title,
          totalMarks: totalMarks,
          maxMarks: evaluation.maxMarks,
          success: true
        });

      } catch (error) {
        results.failed++;
        results.details.push({
          evaluationId: evalId,
          success: false,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk grading completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk AI grading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during bulk AI grading',
      error: error.message
    });
  }
};

// @desc    Evaluate subjective answer using AI
// @route   POST /api/evaluations/:id/evaluate-subjective
// @access  Private (Faculty/Admin)
export const evaluateSubjectiveAnswer = async (req, res) => {
  try {
    const { answerIndex, studentAnswer, actionType } = req.body;

    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    const exam = await Exam.findById(evaluation.exam).select('createdBy questions');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check authorization
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to evaluate this exam'
      });
    }

    const answerIdx = Number(answerIndex);
    if (Number.isNaN(answerIdx) || answerIdx < 0 || answerIdx >= evaluation.answers.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer index'
      });
    }

    const answer = evaluation.answers[answerIdx];
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    const question =
      exam.questions.find(q => q.questionNumber === answer.questionNumber) ||
      exam.questions[answerIdx];

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Import AI evaluation service
    const { evaluateSubjectiveAnswer: aiEvaluate } = await import('../services/aiSubjectiveEvaluationService.js');

    // Call AI evaluation service
    const referenceAnswer = question.rubric || question.correctAnswer || question.questionText || '';
    const aiEvaluation = await aiEvaluate(
      studentAnswer || answer.answer,
      referenceAnswer,
      question.questionText,
      question.marks
    );

    if (aiEvaluation.error) {
      return res.status(500).json({
        success: false,
        message: 'Error during AI evaluation',
        error: aiEvaluation.error
      });
    }

    // Update the answer with AI evaluation results
    evaluation.answers[answerIdx] = {
      ...answer.toObject(),
      studentAnswerKeywords: aiEvaluation.studentAnswerKeywords,
      aiAnswerKeywords: aiEvaluation.aiAnswerKeywords,
      keywordMatchScore: aiEvaluation.keywordMatchScore,
      aiAutoMarks: aiEvaluation.aiAutoMarks,
      aiConfidenceScore: aiEvaluation.aiConfidenceScore,
      requiresManualReview: aiEvaluation.requiresManualReview
    };

    // If actionType is 'accept', automatically accept the AI marks
    if (actionType === 'accept') {
      evaluation.answers[answerIdx].marksObtained = aiEvaluation.aiAutoMarks;
      evaluation.answers[answerIdx].manualReviewStatus = 'accepted';
      evaluation.answers[answerIdx].manualReviewBy = req.user.id;
      evaluation.answers[answerIdx].manualReviewedAt = new Date();
    }

    // Update audit log
    evaluation.auditLog.push({
      action: 'AI subjective evaluation',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: `AI evaluation performed for question ${answer.questionNumber}. Confidence: ${aiEvaluation.aiConfidenceScore}%, Match: ${aiEvaluation.keywordMatchScore}%`
    });

    await evaluation.save();

    res.status(200).json({
      success: true,
      message: 'Subjective answer evaluated successfully',
      evaluation: {
        answerIndex,
        studentAnswerKeywords: aiEvaluation.studentAnswerKeywords,
        aiAnswerKeywords: aiEvaluation.aiAnswerKeywords,
        keywordMatchScore: aiEvaluation.keywordMatchScore,
        aiAutoMarks: aiEvaluation.aiAutoMarks,
        aiConfidenceScore: aiEvaluation.aiConfidenceScore,
        requiresManualReview: aiEvaluation.requiresManualReview,
        recommendation: aiEvaluation.evaluation.recommendation
      }
    });
  } catch (error) {
    console.error('Subjective answer evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating subjective answer',
      error: error.message
    });
  }
};

// @desc    Submit manual review for subjective answer
// @route   POST /api/evaluations/:id/subjective-manual-review
// @access  Private (Faculty/Admin)
export const submitSubjectiveManualReview = async (req, res) => {
  try {
    const { answerIndex, manualMarks, feedback } = req.body;

    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    const exam = await Exam.findById(evaluation.exam).select('createdBy questions');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check authorization
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this exam'
      });
    }

    const answerIdx = Number(answerIndex);
    if (Number.isNaN(answerIdx) || answerIdx < 0 || answerIdx >= evaluation.answers.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer index'
      });
    }

    const answer = evaluation.answers[answerIdx];
    const question =
      exam.questions.find(q => q.questionNumber === answer.questionNumber) ||
      exam.questions[answerIdx];

    if (!answer || !question) {
      return res.status(404).json({
        success: false,
        message: 'Answer or question not found'
      });
    }

    // Validate marks are within range
    if (manualMarks < 0 || manualMarks > question.marks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${question.marks}`
      });
    }

    // Update the answer with manual review
    evaluation.answers[answerIdx].marksObtained = manualMarks;
    evaluation.answers[answerIdx].manualMarksAssigned = manualMarks;
    evaluation.answers[answerIdx].manualFeedback = feedback;
    evaluation.answers[answerIdx].manualReviewStatus = 'reviewed';
    evaluation.answers[answerIdx].manualReviewBy = req.user.id;
    evaluation.answers[answerIdx].manualReviewedAt = new Date();

    // Add to audit log
    evaluation.auditLog.push({
      action: 'Subjective answer manual review',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: `Faculty manually reviewed subjective answer. Auto marks: ${answer.aiAutoMarks}, Manual marks: ${manualMarks}, Feedback: ${feedback}`
    });

    await evaluation.save();

    res.status(200).json({
      success: true,
      message: 'Manual review submitted successfully',
      evaluation: {
        answerIndex,
        marksObtained: manualMarks,
        manualFeedback: feedback,
        manualReviewStatus: 'reviewed'
      }
    });
  } catch (error) {
    console.error('Subjective manual review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting manual review',
      error: error.message
    });
  }
};
