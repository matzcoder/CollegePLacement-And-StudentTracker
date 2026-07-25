import prisma from '../config/db';
import logger from '../utils/logger';

export async function logActivity(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId || undefined,
        action,
        entityType: entityType || undefined,
        entityId: entityId || undefined,
        ipAddress: ipAddress || undefined,
      },
    });
  } catch (err) {
    logger.warn('Failed to write audit log', { err });
  }
}
