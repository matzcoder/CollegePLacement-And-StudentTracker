const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT', isActive: true } });
    const totalApplications = await prisma.application.count();
    const totalCompanies = await prisma.company.count();

    const allApps = await prisma.application.findMany({
      include: {
        student: true,
        drive: { include: { company: true } },
      },
    });

    const acceptedOrOffered = allApps.filter((a) => {
      const stg = (a.stage || '').toUpperCase();
      const ost = (a.offerStatus || '').toUpperCase();
      return ost === 'OFFERED' || ost === 'ACCEPTED' || ost === 'SELECTED' || ost === 'OFFER_ACCEPTED' || stg === 'OFFERED' || stg === 'OFFER';
    });

    const placedStudentIds = new Set(acceptedOrOffered.map((a) => a.studentId));
    const offers = acceptedOrOffered.length;
    const packages = acceptedOrOffered
      .filter((a) => a.packageOffered != null && a.packageOffered > 0)
      .map((a) => a.packageOffered);

    const avgPackage = packages.length ? packages.reduce((sum, p) => sum + p, 0) / packages.length : null;
    const highestPackage = packages.length ? Math.max(...packages) : null;
    const placementRate = totalStudents > 0 ? `${((placedStudentIds.size / totalStudents) * 100).toFixed(1)}%` : '0%';

    const stageMap = {};
    allApps.forEach((a) => {
      const stage = (a.stage || 'APPLIED').toLowerCase();
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    });

    const deptMap = {};
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isActive: true },
      select: { department: true },
    });
    students.forEach((s) => {
      const dept = s.department || 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 15,
      include: {
        user: {
          select: { fullName: true, email: true, role: true },
        },
      },
    });

    return res.status(200).json({
      kpis: {
        totalStudents,
        totalApplications,
        totalCompanies,
        offers,
        placementRate,
        avgPackage,
        highestPackage,
      },
      charts: {
        stageBreakdown: Object.entries(stageMap).map(([stage, count]) => ({
          stage,
          _count: { id: count },
        })),
        deptWise: Object.entries(deptMap).map(([department, count]) => ({
          department,
          _count: { id: count },
        })),
        companyWise: [],
      },
      recentActivity: recentLogs.map((l) => ({
        id: l.id,
        action: l.action,
        impactedEntity: l.impactedEntity,
        createdAt: l.timestamp.toISOString(),
        user: l.user
          ? { name: l.user.fullName, email: l.user.email, role: l.user.role.toLowerCase() }
          : { name: l.actorName, role: l.role.toLowerCase() },
      })),
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin dashboard' });
  }
});

router.get('/student', authenticateToken, async (req, res) => {
  try {
    const studentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        applications: {
          include: {
            drive: {
              include: { company: true },
            },
          },
          orderBy: { appliedOn: 'desc' },
        },
      },
    });

    if (!studentUser) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const apps = (studentUser.applications || []).map((a) => ({
      id: a.id,
      applicationId: a.id,
      stage: (a.stage || 'applied').toLowerCase(),
      offerStatus: (a.offerStatus || 'pending').toLowerCase(),
      package: a.packageOffered,
      packageOffered: a.packageOffered,
      appliedOn: a.appliedOn ? a.appliedOn.toISOString() : a.createdAt.toISOString(),
      drive: {
        roleTitle: a.drive.roleTitle,
        roleOffered: a.drive.roleTitle,
        driveDate: a.drive.driveDate.toISOString(),
        company: {
          name: a.drive.company.name,
          industry: a.drive.company.industry,
        },
      },
    }));

    const totalApplied = apps.length;
    const offers = apps.filter((a) => ['selected', 'offer_accepted', 'offered'].includes(a.offerStatus) || a.stage === 'offer').length;
    const shortlisted = apps.filter((a) => ['shortlisted', 'assessment', 'interview', 'offer'].includes(a.stage)).length;

    return res.status(200).json({
      profile: {
        id: studentUser.id,
        name: studentUser.fullName,
        email: studentUser.email,
        rollNumber: studentUser.rollNumber,
        department: studentUser.department,
        cgpa: studentUser.cgpa,
      },
      applications: apps,
      kpis: {
        totalApplied,
        offers,
        shortlisted,
      },
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch student dashboard' });
  }
});

module.exports = router;
