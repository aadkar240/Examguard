import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  respondToGrievance,
  resolveGrievance,
  escalateGrievance,
  getMyGrievances,
  submitFeedback,
  reviewGrievanceEvaluation
} from '../controllers/grievanceController.js';

const router = express.Router();

// Student routes
router.post('/', protect, authorize('student'), createGrievance);
router.get('/my-grievances', protect, authorize('student'), getMyGrievances);
router.post('/:id/feedback', protect, authorize('student'), submitFeedback);

// Common routes
router.get('/:id', protect, getGrievanceById);

// Faculty/Admin routes
router.get('/', protect, authorize('faculty', 'admin'), getGrievances);
router.patch('/:id/status', protect, authorize('faculty', 'admin'), updateGrievanceStatus);
router.post('/:id/respond', protect, authorize('faculty', 'admin'), respondToGrievance);
router.post('/:id/resolve', protect, authorize('faculty', 'admin'), resolveGrievance);
router.post('/:id/escalate', protect, authorize('faculty', 'admin'), escalateGrievance);
router.post('/:id/review-evaluation', protect, authorize('faculty', 'admin'), reviewGrievanceEvaluation);

export default router;
