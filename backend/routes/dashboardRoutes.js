import express from 'express';
import { protect } from '../middleware/auth.js';
import { getDashboardStats, getStudentDashboard, getFacultyDashboard, getAdminDashboard } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/student', protect, getStudentDashboard);
router.get('/faculty', protect, getFacultyDashboard);
router.get('/admin', protect, getAdminDashboard);

export default router;
