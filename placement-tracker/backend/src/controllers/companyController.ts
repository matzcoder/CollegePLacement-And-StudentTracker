import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { createError } from '../middleware/errorHandler';
import { logActivity } from '../middleware/auditLog';

const companySchema = z.object({
  name: z.string().min(1).max(150),
  industry: z.string().optional(),
  packageMin: z.number().optional(),
  packageMax: z.number().optional(),
  website: z.string().url().optional(),
});

export async function listCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, industry, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (industry) where.industry = { contains: industry, mode: 'insensitive' };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
      prisma.company.count({ where }),
    ]);
    res.json({ companies, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = companySchema.parse(req.body);
    const company = await prisma.company.create({ data });
    await logActivity(req.user!.userId, 'CREATE_COMPANY', 'company', company.id, req.ip);
    res.status(201).json({ company });
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = companySchema.partial().parse(req.body);
    const company = await prisma.company.update({ where: { id }, data });
    await logActivity(req.user!.userId, 'UPDATE_COMPANY', 'company', id, req.ip);
    res.json({ company });
  } catch (err) {
    next(err);
  }
}

export async function deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const exists = await prisma.company.findUnique({ where: { id } });
    if (!exists) throw createError('Company not found', 404);
    await prisma.company.delete({ where: { id } });
    await logActivity(req.user!.userId, 'DELETE_COMPANY', 'company', id, req.ip);
    res.json({ message: 'Company deleted' });
  } catch (err) {
    next(err);
  }
}
