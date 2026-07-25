import { Router } from 'express';
import { listNotifications, markNotificationRead, markAllRead } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, listNotifications);
router.put('/read-all', authMiddleware, markAllRead);
router.put('/:id/read', authMiddleware, markNotificationRead);

export default router;
