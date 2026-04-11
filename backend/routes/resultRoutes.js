import express from 'express';
import { generateResult, getMyResult, getMyResults, getLatestResult, deleteResult } from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generate result from last 5 completed evaluations
router.post('/generate', generateResult);

// Get student's latest result
router.get('/my-result', getMyResult);

// Get student's all generated results (latest first)
router.get('/my-results', getMyResults);

// Get result eligibility check (returns data if ready to generate)
router.get('/latest', getLatestResult);

// Delete a result
router.delete('/:resultId', deleteResult);

export default router;
