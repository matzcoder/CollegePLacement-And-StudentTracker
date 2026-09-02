const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/users
router.get('/users', authenticateToken, requireRole(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        rollNumber: true,
        department: true,
        cgpa: true,
        activeBacklogs: true,
        isActive: true,
        createdAt: true,
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.fullName,
      fullName: u.fullName,
      email: u.email,
      role: u.role.toLowerCase(),
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      student: u.rollNumber
        ? {
            rollNumber: u.rollNumber,
            department: u.department,
            cgpa: u.cgpa,
          }
        : null,
    }));

    return res.status(200).json({ users: formatted });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/students
router.post('/students', authenticateToken, requireRole(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const { name, fullName, email, password, rollNumber, department, cgpa, activeBacklogs } = req.body;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password || 'Student@1234', 10);
    const user = await prisma.user.create({
      data: {
        fullName: fullName || name,
        email: email.toLowerCase().trim(),
        passwordHash,
        rollNumber,
        department,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        activeBacklogs: activeBacklogs ? parseInt(activeBacklogs, 10) : 0,
        role: 'STUDENT',
        isActive: true,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Admin',
          role: req.user.role,
          action: 'ADD_STUDENT',
          impactedEntity: `${user.fullName} (${user.rollNumber})`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(201).json({ user: { id: user.id, name: user.fullName, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/admin/users/:id/deactivate
router.put('/users/:id/deactivate', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Admin',
          role: req.user.role,
          action: 'DEACTIVATE_USER',
          impactedEntity: user.fullName,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(200).json({ message: 'User deactivated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role.toUpperCase() },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Admin',
          role: req.user.role,
          action: 'UPDATE_USER_ROLE',
          impactedEntity: `${updated.fullName} -> ${role.toUpperCase()}`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(200).json({ user: { id: updated.id, role: updated.role.toLowerCase() } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/reports
router.get('/reports', authenticateToken, requireRole(['ADMIN', 'OFFICER']), async (req, res) => {
  try {
    const apps = await prisma.application.findMany({
      include: {
        student: true,
        drive: {
          include: { company: true },
        },
      },
      orderBy: { appliedOn: 'desc' },
    });

    const report = apps.map((a) => ({
      applicationId: a.id,
      studentName: a.student?.fullName,
      rollNumber: a.student?.rollNumber,
      department: a.student?.department,
      cgpa: a.student?.cgpa,
      company: a.drive?.company?.name || 'Company',
      industry: a.drive?.company?.industry || '',
      driveDate: a.drive?.driveDate ? a.drive.driveDate.toISOString() : '',
      stage: (a.stage || 'applied').toLowerCase(),
      offerStatus: (a.offerStatus || 'pending').toLowerCase(),
      package: a.packageOffered,
      packageOffered: a.packageOffered,
      appliedOn: a.appliedOn ? a.appliedOn.toISOString() : a.createdAt.toISOString(),
    }));

    return res.status(200).json({ report, total: report.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;
