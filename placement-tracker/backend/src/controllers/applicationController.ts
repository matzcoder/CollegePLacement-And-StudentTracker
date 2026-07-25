import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { createError } from '../middleware/errorHandler';
import { logActivity } from '../middleware/auditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { Prisma } from '@prisma/client';

const applySchema = z.object({
  driveId: z.string().uuid(),
});

const updateSchema = z.object({
  stage: z.enum(['applied', 'shortlisted', 'interview', 'offer', 'rejected']).optional(),
  offerStatus: z.enum(['pending', 'selected', 'rejected', 'offer_accepted', 'offer_declined']).optional(),
  package: z.number().optional(),
});

export async function listApplications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { stage, offerStatus, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Prisma.ApplicationWhereInput = {};

    // Students see only their own applications
    if (req.user!.role === 'student') {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { studentId: true } });
      if (!user?.studentId) throw createError('Student profile not found', 404);
      where.studentId = user.studentId;
    }

    if (stage) where.stage = stage as any;
    if (offerStatus) where.offerStatus = offerStatus as any;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          student: { select: { fullName: true, rollNumber: true, department: true } },
          drive: { include: { company: { select: { name: true, industry: true } } } },
        },
        orderBy: { appliedOn: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    res.json({ applications, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

export async function applyToDrive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driveId } = applySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { studentId: true } });
    if (!user?.studentId) throw createError('Student profile not found', 404);

    // Fix 2.7: Check duplicate application at service layer before INSERT
    const existing = await prisma.application.findFirst({
      where: { studentId: user.studentId, driveId },
    });
    if (existing) throw createError('You have already applied to this drive', 409);

    const application = await prisma.application.create({
      data: {
        studentId: user.studentId,
        driveId,
        stage: 'applied',
        offerStatus: 'pending', // Fix 2.10: explicit default
      },
      include: {
        student: { select: { fullName: true, rollNumber: true, department: true } },
        drive: { include: { company: { select: { name: true } } } },
      },
    });

    await logActivity(req.user!.userId, 'APPLY_TO_DRIVE', 'application', application.id, req.ip);
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

export async function updateApplication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const application = await prisma.application.update({
      where: { id },
      data,
      include: {
        student: { select: { fullName: true, rollNumber: true, department: true } },
        drive: { include: { company: { select: { name: true } } } },
      },
    });

    await logActivity(req.user!.userId, 'UPDATE_APPLICATION', 'application', id, req.ip);
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

export async function withdrawApplication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({ where: { id }, select: { studentId: true } });
    if (!application) throw createError('Application not found', 404);

    // Students can only withdraw their own applications
    if (req.user!.role === 'student') {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { studentId: true } });
      if (application.studentId !== user?.studentId) throw createError('Forbidden', 403);
    }

    await prisma.application.delete({ where: { id } });
    await logActivity(req.user!.userId, 'WITHDRAW_APPLICATION', 'application', id, req.ip);
    res.json({ message: 'Application withdrawn' });
  } catch (err) {
    next(err);
  }
}
