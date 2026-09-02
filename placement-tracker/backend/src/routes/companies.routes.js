const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { drives: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = companies.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      packageMin: c.minPackage,
      packageMax: c.maxPackage,
      website: c.websiteUrl,
      websiteUrl: c.websiteUrl,
      createdAt: c.createdAt.toISOString(),
      driveCount: c._count.drives,
    }));

    return res.status(200).json({ companies: formatted, total: formatted.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const { name, industry, packageMin, minPackage, packageMax, maxPackage, website, websiteUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        industry: industry || 'Technology & Consulting',
        minPackage: minPackage !== undefined ? parseFloat(minPackage) : packageMin !== undefined ? parseFloat(packageMin) : null,
        maxPackage: maxPackage !== undefined ? parseFloat(maxPackage) : packageMax !== undefined ? parseFloat(packageMax) : null,
        websiteUrl: websiteUrl || website || null,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Officer',
          role: req.user.role,
          action: 'CREATE_COMPANY',
          impactedEntity: company.name,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(201).json({ company });
  } catch (err) {
    console.error('Error creating company:', err);
    return res.status(500).json({ error: 'Failed to create company' });
  }
});

router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await prisma.company.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Admin',
          role: req.user.role,
          action: 'DELETE_COMPANY',
          impactedEntity: company.name,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete company' });
  }
});

module.exports = router;
