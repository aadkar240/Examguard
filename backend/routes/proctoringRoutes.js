import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  startProctoringSession,
  logProctoringEvent,
  endProctoringSession,
  uploadRecordingMiddleware,
  uploadRecording,
  getAdminRecordings,
  streamAdminRecording,
  getAdminProctoringSessions,
  getSessionViolations,
  deleteAdminRecordings,
} from '../controllers/proctoringController.js';

const router = express.Router();

router.post('/session/start', protect, authorize('student'), startProctoringSession);
router.post('/session/:sessionId/event', protect, authorize('student'), logProctoringEvent);
router.post('/session/:sessionId/end', protect, authorize('student'), endProctoringSession);

router.post('/upload', protect, authorize('student'), uploadRecordingMiddleware, uploadRecording);

router.get('/admin-recordings', protect, authorize('admin'), getAdminRecordings);
router.delete('/admin-recordings', protect, authorize('admin'), deleteAdminRecordings);
router.get('/admin-sessions', protect, authorize('admin'), getAdminProctoringSessions);
router.get('/admin-sessions/:sessionId/violations', protect, authorize('admin'), getSessionViolations);

router.get('/recordings/:id/stream', streamAdminRecording);

export default router;
