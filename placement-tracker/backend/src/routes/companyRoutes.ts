import { Router } from 'express';
import { listCompanies, createCompany, updateCompany, deleteCompany } from '../controllers/companyController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, listCompanies);
router.post('/', authMiddleware, requireRole('officer', 'admin'), createCompany);
router.put('/:id', authMiddleware, requireRole('officer', 'admin'), updateCompany);
router.delete('/:id', authMiddleware, requireRole('admin'), deleteCompany);

export default router;
