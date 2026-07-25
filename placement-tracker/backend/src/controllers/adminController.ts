import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { logActivity } from '../middleware/auditLog';
import { hashPassword } from '../utils/hashUtils';

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        student: { select: { rollNumber: true, department: true, cgpa: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const schema = z.object({ role: z.enum(['student', 'officer', 'admin']) });
    const { role } = schema.parse(req.body);
    const user = await prisma.user.update({ where: { id }, data: { role: role as any } });
    await logActivity(req.user!.userId, 'UPDATE_USER_ROLE', 'user', id, req.ip);
    res.json({ user: { id: user.id, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (id === req.user!.userId) throw createError('Cannot deactivate your own account', 400);

    await prisma.user.update({ where: { id }, data: { isActive: false } });

    // Fix 2.9: Revoke all refresh tokens for deactivated user
    await prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });

    await logActivity(req.user!.userId, 'DEACTIVATE_USER', 'user', id, req.ip);
    res.json({ message: 'User deactivated and all sessions revoked' });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true, email: true } } },
      }),
      prisma.activityLog.count(),
    ]);

    res.json({ logs, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
}

export async function getReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const applications = await prisma.application.findMany({
      include: {
        student: { select: { fullName: true, rollNumber: true, department: true, cgpa: true } },
        drive: { include: { company: { select: { name: true, industry: true } } } },
      },
    });

    // Fix 2.5: Include roll_number for disambiguation in all admin views
    const report = applications.map((a) => ({
      applicationId: a.id,
      studentName: a.student.fullName,
      rollNumber: a.student.rollNumber, // Fix 2.5: always include for disambiguation
      department: a.student.department,
      cgpa: Number(a.student.cgpa),
      company: a.drive.company.name,
      industry: a.drive.company.industry,
      driveDate: a.drive.driveDate,
      stage: a.stage,
      offerStatus: a.offerStatus,
      package: a.package ? Number(a.package) : null,
      appliedOn: a.appliedOn,
    }));

    res.json({ report, total: report.length });
  } catch (err) {
    next(err);
  }
}

const addStudentSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  rollNumber: z.string().min(3).max(20),
  department: z.string().min(2).max(50),
  cgpa: z.number().min(0).max(10),
  batchYear: z.number().int().min(2020).max(2030),
  phone: z.string().optional(),
  backlogCount: z.number().int().min(0).default(0),
});

export async function addStudent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = addStudentSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw createError('Email already registered', 409);

    const existingStudent = await prisma.student.findUnique({ where: { rollNumber: data.rollNumber } });
    if (existingStudent) throw createError('Roll number already exists', 409);

    const passwordHash = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
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

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: 'student',
          studentId: student.id,
        },
        select: { id: true, name: true, email: true, role: true },
      });

      return { student, user };
    });

    await logActivity(req.user!.userId, 'ADD_STUDENT', 'user', result.user.id, req.ip);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
