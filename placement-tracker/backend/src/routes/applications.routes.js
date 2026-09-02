const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function normalizeStage(s) {
  if (!s) return 'applied';
  const lower = s.toLowerCase();
  if (lower === 'applied') return 'applied';
  if (lower === 'under_review' || lower === 'under review') return 'under_review';
  if (lower === 'shortlisted') return 'shortlisted';
  if (lower === 'assessment') return 'assessment';
  if (lower === 'interview') return 'interview';
  if (lower === 'offered' || lower === 'offer') return 'offer';
  if (lower === 'rejected') return 'rejected';
  return lower;
}

function normalizeOfferStatus(s) {
  if (!s) return 'pending';
  const lower = s.toLowerCase();
  if (lower === 'pending') return 'pending';
  if (lower === 'offered' || lower === 'selected') return 'selected';
  if (lower === 'accepted' || lower === 'offer_accepted') return 'offer_accepted';
  if (lower === 'declined' || lower === 'offer_declined') return 'offer_declined';
  if (lower === 'not_offered' || lower === 'rejected') return 'rejected';
  return lower;
}

// GET /api/applications/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT', isActive: true },
    });

    const totalApplications = await prisma.application.count();
    const totalCompanies = await prisma.company.count();

    const allApps = await prisma.application.findMany({
      include: {
        student: {
          select: { department: true },
        },
      },
    });

    const acceptedOrOffered = allApps.filter((a) => {
      const stg = (a.stage || '').toUpperCase();
      const ost = (a.offerStatus || '').toUpperCase();
      return ost === 'OFFERED' || ost === 'ACCEPTED' || ost === 'SELECTED' || ost === 'OFFER_ACCEPTED' || stg === 'OFFERED' || stg === 'OFFER';
    });

    const uniquePlacedStudentIds = new Set(acceptedOrOffered.map((a) => a.studentId));
    const offers = acceptedOrOffered.length;
    const placedCount = uniquePlacedStudentIds.size;

    const packages = acceptedOrOffered
      .filter((a) => a.packageOffered != null && a.packageOffered > 0)
      .map((a) => a.packageOffered);

    const avgPackage = packages.length ? packages.reduce((sum, p) => sum + p, 0) / packages.length : null;
    const highestPackage = packages.length ? Math.max(...packages) : null;
    const placementRate = totalStudents > 0 ? `${((placedCount / totalStudents) * 100).toFixed(1)}%` : '0%';

    // Stage breakdown
    const stageMap = {};
    allApps.forEach((a) => {
      const norm = (a.stage || 'APPLIED').toUpperCase();
      stageMap[norm] = (stageMap[norm] || 0) + 1;
    });

    // Dept wise breakdown
    const deptMap = {};
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isActive: true },
      select: { department: true },
    });
    students.forEach((s) => {
      const dept = s.department || 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    return res.status(200).json({
      totalStudents,
      totalApplications,
      totalCompanies,
      offers,
      placedCount,
      placementRate,
      avgPackage,
      highestPackage,
      stageBreakdown: Object.entries(stageMap).map(([stage, count]) => ({
        stage,
        _count: { id: count },
      })),
      deptWise: Object.entries(deptMap).map(([department, count]) => ({
        department,
        _count: { id: count },
      })),
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/applications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isStudent = (req.user.role || '').toUpperCase() === 'STUDENT';
    const whereClause = isStudent ? { studentId: req.user.id } : {};

    const apps = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            rollNumber: true,
            department: true,
            cgpa: true,
            email: true,
          },
        },
        drive: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { appliedOn: 'desc' },
    });

    const formatted = apps.map((a) => {
      const stg = (a.stage || 'APPLIED').toUpperCase();
      const ost = (a.offerStatus || 'PENDING').toUpperCase();

      return {
        id: a.id,
        applicationId: a.id,
        studentId: a.studentId,
        driveId: a.driveId,
        stage: normalizeStage(stg),
        rawStage: stg,
        offerStatus: normalizeOfferStatus(ost),
        rawOfferStatus: ost,
        package: a.packageOffered,
        packageOffered: a.packageOffered,
        outcome: a.outcome,
        appliedOn: a.appliedOn ? a.appliedOn.toISOString() : a.createdAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        studentName: a.student?.fullName,
        rollNumber: a.student?.rollNumber,
        department: a.student?.department,
        cgpa: a.student?.cgpa,
        company: a.drive?.company?.name || 'Company',
        industry: a.drive?.company?.industry || '',
        driveDate: a.drive?.driveDate ? a.drive.driveDate.toISOString() : '',
        student: a.student
          ? {
              id: a.student.id,
              fullName: a.student.fullName,
              rollNumber: a.student.rollNumber,
              department: a.student.department,
              cgpa: a.student.cgpa,
            }
          : undefined,
        drive: a.drive
          ? {
              id: a.drive.id,
              roleTitle: a.drive.roleTitle,
              roleOffered: a.drive.roleTitle,
              driveDate: a.drive.driveDate ? a.drive.driveDate.toISOString() : '',
              status: a.drive.status,
              company: {
                id: a.drive.company?.id,
                name: a.drive.company?.name,
                industry: a.drive.company?.industry,
                website: a.drive.company?.websiteUrl,
              },
            }
          : undefined,
      };
    });

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching applications:', err);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /api/applications (Student applies to a drive)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { driveId } = req.body;
    if (!driveId) {
      return res.status(400).json({ error: 'driveId is required' });
    }

    const drive = await prisma.placementDrive.findUnique({
      where: { id: driveId },
      include: { company: true },
    });

    if (!drive) {
      return res.status(404).json({ error: 'Placement drive not found' });
    }

    const existing = await prisma.application.findUnique({
      where: {
        studentId_driveId: {
          studentId: req.user.id,
          driveId: driveId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already applied to this drive' });
    }

    const application = await prisma.application.create({
      data: {
        studentId: req.user.id,
        driveId: driveId,
        stage: 'APPLIED',
        offerStatus: 'PENDING',
        outcome: 'Pending',
      },
      include: {
        drive: {
          include: { company: true },
        },
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Student',
          role: req.user.role,
          action: 'APPLY_DRIVE',
          impactedEntity: `${drive.company.name} - ${drive.roleTitle}`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(201).json(application);
  } catch (err) {
    console.error('Error creating application:', err);
    return res.status(500).json({ error: 'Failed to apply to drive' });
  }
});

// PATCH /api/applications/:id/status
router.patch('/:id/status', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, offerStatus, package: packageVal, packageOffered, packageAmount } = req.body;

    const existing = await prisma.application.findUnique({
      where: { id },
      include: {
        student: true,
        drive: { include: { company: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const newStage = stage ? stage.toUpperCase() : existing.stage;
    const newOfferStatus = offerStatus ? offerStatus.toUpperCase() : existing.offerStatus;
    const finalPackage =
      packageVal !== undefined
        ? packageVal ? parseFloat(packageVal) : null
        : packageOffered !== undefined
        ? packageOffered ? parseFloat(packageOffered) : null
        : packageAmount !== undefined
        ? packageAmount ? parseFloat(packageAmount) : null
        : existing.packageOffered;

    let outcome = 'Pending';
    if (newOfferStatus === 'OFFERED' || newOfferStatus === 'ACCEPTED' || newOfferStatus === 'OFFER_ACCEPTED' || newOfferStatus === 'SELECTED' || newStage === 'OFFERED' || newStage === 'OFFER') {
      outcome = 'Placed';
    } else if (newOfferStatus === 'NOT_OFFERED' || newOfferStatus === 'REJECTED' || newStage === 'REJECTED') {
      outcome = 'Not Placed';
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        stage: newStage,
        offerStatus: newOfferStatus,
        packageOffered: finalPackage,
        outcome,
      },
      include: {
        student: true,
        drive: { include: { company: true } },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.fullName || 'Placement Officer',
          role: req.user.role,
          action: 'UPDATE_APPLICATION_STAGE',
          impactedEntity: `${updated.student.fullName} -> ${updated.drive.company.name} (${newStage})`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      // ignore
    }

    return res.status(200).json({
      id: updated.id,
      applicationId: updated.id,
      stage: normalizeStage(updated.stage),
      offerStatus: normalizeOfferStatus(updated.offerStatus),
      package: updated.packageOffered,
      packageOffered: updated.packageOffered,
      outcome: updated.outcome,
      updatedAt: updated.updatedAt,
      application: {
        ...updated,
        package: updated.packageOffered,
      },
    });
  } catch (err) {
    console.error('Error updating application stage:', err);
    return res.status(500).json({ error: 'Failed to update application stage' });
  }
});

// PUT /api/applications/:id
router.put('/:id', authenticateToken, requireRole(['OFFICER', 'ADMIN']), async (req, res) => {
  req.url = `/${req.params.id}/status`;
  return router.handle(req, res);
});

module.exports = router;
