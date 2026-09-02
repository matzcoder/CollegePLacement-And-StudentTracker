const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit
router.get('/', authenticateToken, requireRole(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      actorName: l.actorName,
      role: l.role,
      action: l.action,
      impactedEntity: l.impactedEntity,
      ipAddress: l.ipAddress,
      timestamp: l.timestamp.toISOString(),
      createdAt: l.timestamp.toISOString(),
      user: l.user
        ? {
            name: l.user.fullName,
            fullName: l.user.fullName,
            email: l.user.email,
            role: l.user.role.toLowerCase(),
          }
        : {
            name: l.actorName,
            fullName: l.actorName,
            role: l.role.toLowerCase(),
          },
    }));

    return res.status(200).json({ logs: formatted, total: formatted.length });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// POST /api/audit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, impactedEntity, entityType, entityId } = req.body;
    const log = await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actorName: req.user.fullName || 'User',
        role: req.user.role || 'STUDENT',
        action: action || 'ACTIVITY',
        impactedEntity: impactedEntity || `${entityType || 'ENTITY'}:${entityId || ''}`,
        ipAddress: req.ip || '127.0.0.1',
      },
    });
    return res.status(201).json(log);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record audit log' });
  }
});

module.exports = router;
