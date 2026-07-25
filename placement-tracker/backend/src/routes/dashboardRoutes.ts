import { Router } from 'express';
import { studentDashboard, adminDashboard } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/student', authMiddleware, requireRole('student'), studentDashboard);
router.get('/admin', authMiddleware, requireRole('officer', 'admin'), adminDashboard);

export default router;
