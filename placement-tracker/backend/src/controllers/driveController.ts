import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { createError } from '../middleware/errorHandler';
import { logActivity } from '../middleware/auditLog';
import { AuthRequest } from '../middleware/authMiddleware';

const driveSchema = z.object({
  companyId: z.string().uuid(),
  driveDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  eligibleDepartments: z.string().optional(),
  minCgpa: z.number().min(0).max(10).optional(),
  roleOffered: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
});

export async function listDrives(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, department, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (department) where.eligibleDepartments = { contains: department, mode: 'insensitive' };

    const [drives, total] = await Promise.all([
      prisma.placementDrive.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { company: { select: { id: true, name: true, industry: true } } },
        orderBy: { driveDate: 'asc' },
      }),
      prisma.placementDrive.count({ where }),
    ]);

    res.json({ drives, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

export async function createDrive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = driveSchema.parse(req.body);
    const drive = await prisma.placementDrive.create({
      data: { ...data, driveDate: new Date(data.driveDate) },
      include: { company: { select: { name: true } } },
    });
    await logActivity(req.user!.userId, 'CREATE_DRIVE', 'drive', drive.id, req.ip);
    res.status(201).json({ drive });
  } catch (err) {
    next(err);
  }
}

export async function updateDrive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = driveSchema.partial().parse(req.body);
    const drive = await prisma.placementDrive.update({
      where: { id },
      data: data.driveDate ? { ...data, driveDate: new Date(data.driveDate) } : data,
      include: { company: { select: { name: true } } },
    });
    await logActivity(req.user!.userId, 'UPDATE_DRIVE', 'drive', id, req.ip);
    res.json({ drive });
  } catch (err) {
    next(err);
  }
}

export async function deleteDrive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const exists = await prisma.placementDrive.findUnique({ where: { id } });
    if (!exists) throw createError('Drive not found', 404);
    await prisma.placementDrive.delete({ where: { id } });
    await logActivity(req.user!.userId, 'DELETE_DRIVE', 'drive', id, req.ip);
    res.json({ message: 'Drive deleted' });
  } catch (err) {
    next(err);
  }
}
