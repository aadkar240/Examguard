import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
	getAllUsers,
	createUser,
	getUserById,
	updateUser,
	deleteUser,
	getRegisteredUsersRegistry,
	updateStudentExamAccess,
	rescheduleStudentExam
} from '../controllers/userController.js';

const router = express.Router();

// Admin only routes
router.get('/registry', protect, authorize('admin'), getRegisteredUsersRegistry);
router.patch('/student-exam-access', protect, authorize('admin'), updateStudentExamAccess);
router.patch('/student-exam-reschedule', protect, authorize('admin'), rescheduleStudentExam);
router.post('/', protect, authorize('admin'), createUser);
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
