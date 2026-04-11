import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  generateAiExam,
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  getMyExams,
  submitExam,
  getUpcomingExams,
  submitExamFeedback
} from '../controllers/examController.js';

const router = express.Router();

// AI generation route
router.post('/ai-generate', protect, authorize('faculty', 'admin'), generateAiExam);

// Student routes
router.get('/my-exams', protect, authorize('student'), getMyExams);
router.get('/upcoming', protect, getUpcomingExams);
router.post('/:id/submit', protect, authorize('student'), submitExam);
router.post('/:id/feedback', protect, authorize('student'), submitExamFeedback);

// Faculty/Admin routes
router.post('/', protect, authorize('faculty', 'admin'), createExam);
router.get('/', protect, getAllExams);
router.get('/:id', protect, getExamById);
router.put('/:id', protect, authorize('faculty', 'admin'), updateExam);
router.delete('/:id', protect, authorize('faculty', 'admin'), deleteExam);
router.patch('/:id/publish', protect, authorize('faculty', 'admin'), publishExam);

export default router;
