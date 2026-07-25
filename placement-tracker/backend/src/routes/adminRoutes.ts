import { Router } from 'express';
import { listUsers, updateUserRole, deactivateUser, getAuditLogs, getReports, addStudent } from '../controllers/adminController';
import { createCompany } from '../controllers/companyController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/users', authMiddleware, requireRole('admin'), listUsers);
router.post('/companies', authMiddleware, requireRole('admin'), createCompany);
router.post('/students', authMiddleware, requireRole('admin'), addStudent);
router.put('/users/:id/role', authMiddleware, requireRole('admin'), updateUserRole);
router.put('/users/:id/deactivate', authMiddleware, requireRole('admin'), deactivateUser);
router.get('/audit', authMiddleware, requireRole('admin'), getAuditLogs);
router.get('/reports', authMiddleware, requireRole('officer', 'admin'), getReports);

export default router;
