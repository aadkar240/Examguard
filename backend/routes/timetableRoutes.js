import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createTimetable, getLatestTimetable, deleteTimetable } from '../controllers/timetableController.js';

const router = express.Router();

router.use(protect);

router.get('/latest', getLatestTimetable);
router.post('/', authorize('faculty', 'admin'), createTimetable);
router.delete('/:id', authorize('faculty', 'admin'), deleteTimetable);

export default router;
