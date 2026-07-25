import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';
import { detectIntent } from '../ai-assistant/intentEngine';
import { buildResponse, FALLBACK_RESPONSE } from '../ai-assistant/responseTemplates';

const querySchema = z.object({
  message: z.string().min(1).max(500),
});

export async function assistantQuery(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message } = querySchema.parse(req.body);

    // Security: derive student identity from JWT, never from user input
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { student: true },
    });

    if (!user) throw createError('User not found', 404);

    const { intent, confidence } = detectIntent(message);

    let responseText = FALLBACK_RESPONSE;
    let data: Record<string, unknown> = {};

    if (intent && user.student) {
      // All queries scoped strictly to this student's own data
      const applications = await prisma.application.findMany({
        where: { studentId: user.student.id },
        include: {
          drive: { include: { company: { select: { name: true } } } },
        },
      });

      const appData = applications.map((a) => ({
        company: a.drive.company.name,
        stage: a.stage,
        offerStatus: a.offerStatus,
        package: a.package ? Number(a.package) : undefined,
      }));

      if (intent === 'company_count') {
        const count = await prisma.company.count();
        data = { count };
      } else {
        data = { applications: appData };
      }

      responseText = buildResponse(intent, data);
    }

    // Log interaction (raw_query stored for admin audit only)
    await prisma.assistantLog.create({
      data: {
        userId: user.id,
        rawQuery: message,
        detectedIntent: intent,
        confidence: confidence,
        responseText,
      },
    });

    res.json({ intent, confidence, response: responseText });
  } catch (err) {
    next(err);
  }
}

export async function getAssistantHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const logs = await prisma.assistantLog.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rawQuery: true,
        detectedIntent: true,
        responseText: true,
        createdAt: true,
      },
    });
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}
