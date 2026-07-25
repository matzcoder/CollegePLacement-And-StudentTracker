import { Router } from 'express';
import { assistantQuery, getAssistantHistory } from '../controllers/assistantController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/query', authMiddleware, assistantQuery);
router.get('/history', authMiddleware, getAssistantHistory);

export default router;
