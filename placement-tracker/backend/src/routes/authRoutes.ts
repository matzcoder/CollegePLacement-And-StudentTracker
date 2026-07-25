import { Router } from 'express';
import { register, login, logout, refresh } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', refresh);

export default router;
