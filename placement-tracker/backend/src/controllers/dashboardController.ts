import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { createError } from '../middleware/errorHandler';

export async function studentDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
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

export async function adminDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
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
      prisma.application.count({
        where: { offerStatus: { in: ['offer_accepted', 'selected'] } },
      }),
      prisma.application.aggregate({
        _avg: { package: true },
        where: {
          offerStatus: { in: ['offer_accepted', 'selected'] },
          package: { not: null },
        },
      }),
      prisma.application.aggregate({
        _max: { package: true },
        where: {
          offerStatus: { in: ['offer_accepted', 'selected'] },
          package: { not: null },
        },
      }),
      prisma.application.groupBy({ by: ['driveId'], _count: { id: true } }),
      prisma.student.groupBy({ by: ['department'], _count: { id: true } }),
      prisma.application.groupBy({ by: ['stage'], _count: { id: true } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { name: true, role: true } } },
      }),
    ]);

    const placementRate =
      totalStudents > 0 ? ((offersRaw / totalStudents) * 100).toFixed(1) : '0';

    res.json({
      kpis: {
        totalStudents,
        totalApplications,
        totalCompanies,
        offers: offersRaw,
        placementRate: `${placementRate}%`,
        avgPackage: avgPackageRaw._avg.package,
        highestPackage: highestPackageRaw._max.package,
      },
      charts: { stageBreakdown, deptWise, companyWise },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}
