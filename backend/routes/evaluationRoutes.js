import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getEvaluations,
  getEvaluationById,
  evaluateAnswer,
  requestReEvaluation,
  getMyEvaluations,
  getPendingEvaluations,
  aiGradeEvaluation,
  bulkAiGradeEvaluations,
  getExamFeedbackList,
  evaluateSubjectiveAnswer,
  submitSubjectiveManualReview
} from '../controllers/evaluationController.js';

const router = express.Router();

// Student routes
router.get('/my-evaluations', protect, authorize('student'), getMyEvaluations);
router.get('/feedback/list', protect, authorize('admin'), getExamFeedbackList);
router.get('/:id', protect, getEvaluationById);
router.post('/:id/request-reevaluation', protect, authorize('student'), requestReEvaluation);

// Faculty routes
router.get('/', protect, authorize('faculty', 'admin'), getEvaluations);
router.get('/pending/list', protect, authorize('faculty', 'admin'), getPendingEvaluations);
router.put('/:id/evaluate', protect, authorize('faculty', 'admin'), evaluateAnswer);

// AI Grading routes
router.post('/:id/ai-grade', protect, authorize('faculty', 'admin'), aiGradeEvaluation);
router.post('/bulk/ai-grade', protect, authorize('faculty', 'admin'), bulkAiGradeEvaluations);

// Subjective answer evaluation routes
router.post('/:id/evaluate-subjective', protect, authorize('faculty', 'admin'), evaluateSubjectiveAnswer);
router.post('/:id/subjective-manual-review', protect, authorize('faculty', 'admin'), submitSubjectiveManualReview);

export default router;
