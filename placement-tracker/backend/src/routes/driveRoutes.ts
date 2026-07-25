import { Router } from 'express';
import { listDrives, createDrive, updateDrive, deleteDrive } from '../controllers/driveController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, listDrives);
router.post('/', authMiddleware, requireRole('officer', 'admin'), createDrive);
router.put('/:id', authMiddleware, requireRole('officer', 'admin'), updateDrive);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteDrive);

export default router;
