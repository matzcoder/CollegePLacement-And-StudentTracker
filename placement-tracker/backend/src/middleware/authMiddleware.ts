import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtUtils';
import prisma from '../config/db';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        jti?: string;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);

    // Check token denylist before accepting
    if (payload.jti) {
      const denied = await prisma.tokenDenylist.findUnique({ where: { jti: payload.jti } });
      if (denied) {
        res.status(401).json({ error: 'Token has been revoked' });
        return;
      }
    }

    // Check account is still active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      res.status(401).json({ error: 'Account is deactivated' });
      return;
    }

    req.user = { userId: payload.userId, role: payload.role, jti: payload.jti };
    next();
  } catch (err) {
    logger.warn('Invalid token attempt', { error: err });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
