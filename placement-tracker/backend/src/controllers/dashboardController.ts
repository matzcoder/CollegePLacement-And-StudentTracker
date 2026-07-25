import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/authMiddleware';

export async function studentDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { student: true },
    });

    if (!user?.student) throw createError('Student profile not found', 404);

    const applications = await prisma.application.findMany({
      where: { studentId: user.student.id },
      include: {
        drive: { include: { company: { select: { name: true, industry: true } } } },
      },
      orderBy: { appliedOn: 'desc' },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // KPIs for the student
    const totalApplied = applications.length;
    const offers = applications.filter((a) => ['offer_accepted', 'selected'].includes(a.offerStatus)).length;
    const shortlisted = applications.filter((a) => ['shortlisted', 'interview', 'offer'].includes(a.stage)).length;

    res.json({
      profile: user.student,
      applications,
      notifications,
      kpis: { totalApplied, offers, shortlisted },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Fix 2.4: KPI queries explicitly filter for correct offer_status values
    const [
      totalStudents,
      totalApplications,
      totalCompanies,
      offersRaw,
      avgPackageRaw,
      highestPackageRaw,
      companyWise,
      deptWise,
      stageBreakdown,
      recentActivity,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.application.count(),
      prisma.company.count(),

      // Fix 2.4: count only actual accepted offers
      prisma.application.count({
        where: { offerStatus: { in: ['offer_accepted', 'selected'] } },
      }),

      // Fix 2.4: avg package only where offer is accepted and package is set
      prisma.application.aggregate({
        _avg: { package: true },
        where: {
          offerStatus: { in: ['offer_accepted', 'selected'] },
          package: { not: null },
        },
      }),

      // Fix 2.4: highest package from accepted offers only
      prisma.application.aggregate({
        _max: { package: true },
        where: {
          offerStatus: { in: ['offer_accepted', 'selected'] },
          package: { not: null },
        },
      }),

      // Company-wise application + offer counts
      prisma.application.groupBy({
        by: ['driveId'],
        _count: { id: true },
      }),

      // Department-wise stats using raw approach
      prisma.student.groupBy({
        by: ['department'],
        _count: { id: true },
      }),

      // Stage breakdown
      prisma.application.groupBy({
        by: ['stage'],
        _count: { id: true },
      }),

      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { name: true, role: true } } },
      }),
    ]);

    const totalStudentsCount = totalStudents;
    const placementRate =
      totalStudentsCount > 0 ? ((offersRaw / totalStudentsCount) * 100).toFixed(1) : '0';

    res.json({
      kpis: {
        totalStudents: totalStudentsCount,
        totalApplications,
        totalCompanies,
        offers: offersRaw,
        placementRate: `${placementRate}%`,
        avgPackage: avgPackageRaw._avg.package,
        highestPackage: highestPackageRaw._max.package,
      },
      charts: {
        stageBreakdown,
        deptWise,
        companyWise,
      },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}
