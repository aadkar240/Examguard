import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from '../controllers/announcementController.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('faculty', 'admin'), createAnnouncement);
router.delete('/:id', authorize('faculty', 'admin'), deleteAnnouncement);

export default router;
