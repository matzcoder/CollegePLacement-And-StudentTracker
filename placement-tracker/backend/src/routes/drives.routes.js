const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/drives
router.get('/', async (req, res) => {
  try {
    const drives = await prisma.placementDrive.findMany({
      include: {
        company: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { driveDate: 'asc' },
    });

    const formatted = drives.map((d) => ({
      id: d.id,
      companyId: d.companyId,
      roleTitle: d.roleTitle,
      roleOffered: d.roleTitle,
      minCgpa: d.minCgpa,
      driveDate: d.driveDate,
      status: d.status,
      eligibleDepartments: d.eligibleDepts,
      eligibleDepts: d.eligibleDepts,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      applicationCount: d._count.applications,
      company: {
        id: d.company.id,
        name: d.company.name,
        industry: d.company.industry,
        website: d.company.websiteUrl,
        websiteUrl: d.company.websiteUrl,
        packageMin: d.company.minPackage,
        packageMax: d.company.maxPackage,
      },
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching drives:', err);
    return res.status(500).json({ error: 'Failed to fetch drives' });
  }
});

// POST /api/drives
router.post('/', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const { companyId, roleTitle, roleOffered, minCgpa, driveDate, status, eligibleDepartments, eligibleDepts } = req.body;

    if (!companyId || !driveDate) {
      return res.status(400).json({ error: 'Company ID and drive date are required' });
    }

    const drive = await prisma.placementDrive.create({
      data: {
        companyId,
        roleTitle: roleTitle || roleOffered || 'Graduate Trainee',
        minCgpa: minCgpa ? parseFloat(minCgpa) : 0.0,
        driveDate: new Date(driveDate),
        status: status || 'Upcoming',
        eligibleDepts: eligibleDepts || eligibleDepartments || 'CSE,IT,ECE',
      },
      include: {
        company: true,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Officer',
          role: req.user.role,
          action: 'CREATE_DRIVE',
          impactedEntity: `${drive.company.name} - ${drive.roleTitle}`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(201).json({
      ...drive,
      roleOffered: drive.roleTitle,
      eligibleDepartments: drive.eligibleDepts,
    });
  } catch (err) {
    console.error('Error creating drive:', err);
    return res.status(500).json({ error: 'Failed to create drive' });
  }
});

// DELETE /api/drives/:id
router.delete('/:id', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    await prisma.placementDrive.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Admin',
          role: req.user.role,
          action: 'DELETE_DRIVE',
          impactedEntity: `${drive.company.name} - ${drive.roleTitle}`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(200).json({ message: 'Drive deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete drive' });
  }
});

module.exports = router;
