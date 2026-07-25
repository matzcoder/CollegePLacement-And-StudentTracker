import { Router } from 'express';
import {
  listApplications,
  applyToDrive,
  updateApplication,
  withdrawApplication,
} from '../controllers/applicationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, listApplications);
router.post('/', authMiddleware, requireRole('student'), applyToDrive);
router.put('/:id', authMiddleware, requireRole('officer', 'admin'), updateApplication);
router.delete('/:id', authMiddleware, withdrawApplication);

export default router;
