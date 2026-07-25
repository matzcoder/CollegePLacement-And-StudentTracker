import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/hashUtils';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwtUtils';
import { createError } from '../middleware/errorHandler';
import { logActivity } from '../middleware/auditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';
import { config } from '../config/env';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least 1 letter and 1 number'),
  rollNumber: z.string().min(3).max(20),
  department: z.string().min(2).max(50),
  cgpa: z.number().min(0).max(10),
  batchYear: z.number().int().min(2020).max(2030),
  phone: z.string().optional(),
  backlogCount: z.number().int().min(0).default(0),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDuration(duration: string): Date {
  const now = Date.now();
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(now + value * (ms[unit] || 86400000));
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw createError('Email already registered', 409);

    const passwordHash = await hashPassword(data.password);

    const student = await prisma.student.create({
      data: {
        rollNumber: data.rollNumber,
        fullName: data.name,
        department: data.department,
        cgpa: data.cgpa,
        batchYear: data.batchYear,
        phone: data.phone,
        backlogCount: data.backlogCount,
      },
    });

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'student',
        studentId: student.id,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await logActivity(user.id, 'REGISTER', 'user', user.id, req.ip);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createError('Invalid credentials', 401);
    if (!user.isActive) throw createError('Account is deactivated', 401);

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw createError('Invalid credentials', 401);

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);

    // Store hashed refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: parseDuration(config.jwtRefreshExpiry),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logActivity(user.id, 'LOGIN', 'user', user.id, req.ip);
    res.json({
      token: accessToken,
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Fix 2.8: Add access token jti to denylist
    if (req.user?.jti) {
      const payload = verifyToken(req.headers.authorization!.split(' ')[1]);
      await prisma.tokenDenylist.upsert({
        where: { jti: req.user.jti },
        create: {
          jti: req.user.jti,
          userId: req.user.userId,
          expiresAt: new Date((payload.exp || 0) * 1000),
        },
        update: {},
      });
    }

    // Fix 2.9: Revoke refresh token from cookie
    const cookieToken = req.cookies?.refreshToken;
    if (cookieToken) {
      const tokenHash = hashToken(cookieToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, userId: req.user?.userId },
        data: { revoked: true },
      });
    }

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    await logActivity(req.user?.userId || null, 'LOGOUT', 'user', req.user?.userId, req.ip);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (!cookieToken) throw createError('Refresh token missing', 401);

    const payload = verifyToken(cookieToken);

    // Fix 2.9: Verify token exists in DB and not revoked
    const tokenHash = hashToken(cookieToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw createError('Refresh token invalid or expired', 401);
    }

    // Fix 2.9: Check account is still active
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true, role: true } });
    if (!user?.isActive) throw createError('Account is deactivated', 401);

    const newAccessToken = signAccessToken(payload.userId, user.role);
    res.json({ token: newAccessToken });
  } catch (err) {
    next(err);
  }
}
