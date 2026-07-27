import {
  getData,
  saveData,
  getSession,
  setSession,
  logActivity,
  encodeSessionToken,
  getAuthFromHeader,
  newId,
} from './dataStore';
import { detectIntent, buildResponse, FALLBACK_RESPONSE } from '../ai-assistant/intentEngine';
import type { AppData, SessionUser } from '../data/types';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function requireAuth(authHeader?: string): SessionUser {
  const session = getAuthFromHeader(authHeader);
  if (!session) throw new ApiError('Unauthorized', 401);

  const data = getData();
  const user = data.users.find((u) => u.id === session.userId);
  if (!user?.isActive) throw new ApiError('Account is deactivated', 401);

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function requireRole(session: SessionUser, roles: string[]): void {
  if (!roles.includes(session.role)) throw new ApiError('Forbidden', 403);
}

function getCompany(data: AppData, companyId: string) {
  return data.companies.find((c) => c.id === companyId);
}

function getDriveWithCompany(data: AppData, driveId: string) {
  const drive = data.drives.find((d) => d.id === driveId);
  if (!drive) return null;
  const company = getCompany(data, drive.companyId);
  return { drive, company };
}

function enrichApplication(data: AppData, app: AppData['applications'][0]) {
  const student = data.students.find((s) => s.id === app.studentId);
  const driveInfo = getDriveWithCompany(data, app.driveId);
  return {
    ...app,
    student: student
      ? { fullName: student.fullName, rollNumber: student.rollNumber, department: student.department }
      : undefined,
    drive: driveInfo?.drive && driveInfo.company
      ? {
          ...driveInfo.drive,
          company: { name: driveInfo.company.name, industry: driveInfo.company.industry },
        }
      : undefined,
  };
}

export async function handleLocalRequest(
  method: string,
  url: string,
  body?: unknown,
  authHeader?: string
): Promise<{ status: number; data: unknown }> {
  const path = url.split('?')[0];
  const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');

  try {
    // Auth routes (no prior auth required except logout/refresh)
    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = body as { email: string; password: string };
      const data = getData();
      const user = data.users.find((u) => u.email === email);
      if (!user || user.password !== password) throw new ApiError('Invalid credentials', 401);
      if (!user.isActive) throw new ApiError('Account is deactivated', 401);

      const session: SessionUser = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      setSession(session);
      logActivity(data, user.id, 'LOGIN', 'user', user.id);
      saveData(data);

      return {
        status: 200,
        data: {
          token: encodeSessionToken(session),
          role: user.role,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
        },
      };
    }

    if (method === 'POST' && path === '/auth/logout') {
      const session = getAuthFromHeader(authHeader);
      const data = getData();
      if (session) logActivity(data, session.userId, 'LOGOUT', 'user', session.userId);
      saveData(data);
      setSession(null);
      return { status: 200, data: { message: 'Logged out successfully' } };
    }

    if (method === 'POST' && path === '/auth/refresh') {
      const session = getSession();
      if (!session) throw new ApiError('Refresh token missing', 401);
      const data = getData();
      const user = data.users.find((u) => u.id === session.userId);
      if (!user?.isActive) throw new ApiError('Account is deactivated', 401);
      return { status: 200, data: { token: encodeSessionToken(session) } };
    }

    if (method === 'GET' && path === '/api/health') {
      return { status: 200, data: { status: 'ok', ts: new Date().toISOString() } };
    }

    const session = requireAuth(authHeader);
    const data = getData();

    if (method === 'GET' && path === '/dashboard/student') {
      requireRole(session, ['student']);
      const user = data.users.find((u) => u.id === session.userId);
      const student = data.students.find((s) => s.id === user?.studentId);
      if (!student) throw new ApiError('Student profile not found', 404);

      const applications = data.applications
        .filter((a) => a.studentId === student.id)
        .map((a) => enrichApplication(data, a))
        .sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());

      const totalApplied = applications.length;
      const offers = applications.filter((a) => ['offer_accepted', 'selected'].includes(a.offerStatus)).length;
      const shortlisted = applications.filter((a) => ['shortlisted', 'interview', 'offer'].includes(a.stage)).length;

      return {
        status: 200,
        data: {
          profile: student,
          applications,
          notifications: data.notifications.filter((n) => n.userId === session.userId && !n.isRead),
          kpis: { totalApplied, offers, shortlisted },
        },
      };
    }

    if (method === 'GET' && path === '/dashboard/admin') {
      requireRole(session, ['officer', 'admin']);

      const totalStudents = data.students.length;
      const totalApplications = data.applications.length;
      const totalCompanies = data.companies.length;
      const accepted = data.applications.filter((a) => ['offer_accepted', 'selected'].includes(a.offerStatus));
      const offers = accepted.length;
      const packages = accepted.filter((a) => a.package != null).map((a) => a.package!);
      const avgPackage = packages.length ? packages.reduce((s, p) => s + p, 0) / packages.length : null;
      const highestPackage = packages.length ? Math.max(...packages) : null;
      const placementRate = totalStudents > 0 ? `${((offers / totalStudents) * 100).toFixed(1)}%` : '0%';

      const stageMap: Record<string, number> = {};
      data.applications.forEach((a) => {
        stageMap[a.stage] = (stageMap[a.stage] || 0) + 1;
      });

      const deptMap: Record<string, number> = {};
      data.students.forEach((s) => {
        deptMap[s.department] = (deptMap[s.department] || 0) + 1;
      });

      return {
        status: 200,
        data: {
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
          recentActivity: data.activityLogs.slice(0, 20),
        },
      };
    }

    if (method === 'GET' && path === '/admin/reports') {
      requireRole(session, ['officer', 'admin']);
      const report = data.applications.map((a) => {
        const student = data.students.find((s) => s.id === a.studentId)!;
        const driveInfo = getDriveWithCompany(data, a.driveId)!;
        return {
          applicationId: a.id,
          studentName: student.fullName,
          rollNumber: student.rollNumber,
          department: student.department,
          cgpa: student.cgpa,
          company: driveInfo.company!.name,
          industry: driveInfo.company!.industry,
          driveDate: driveInfo.drive.driveDate,
          stage: a.stage,
          offerStatus: a.offerStatus,
          package: a.package ?? null,
          appliedOn: a.appliedOn,
        };
      });
      return { status: 200, data: { report, total: report.length } };
    }

    if (method === 'GET' && path === '/companies') {
      const limit = parseInt(params.get('limit') || '20', 10);
      const companies = [...data.companies].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
      return { status: 200, data: { companies, total: data.companies.length, page: 1, limit } };
    }

    if (method === 'POST' && path === '/companies') {
      requireRole(session, ['officer', 'admin']);
      const payload = body as {
        name: string;
        industry?: string;
        packageMin?: number;
        packageMax?: number;
        website?: string;
      };
      const company = {
        id: newId('company'),
        name: payload.name,
        industry: payload.industry ?? null,
        packageMin: payload.packageMin ?? null,
        packageMax: payload.packageMax ?? null,
        website: payload.website ?? null,
        createdAt: new Date().toISOString(),
      };
      data.companies.push(company);
      logActivity(data, session.userId, 'CREATE_COMPANY', 'company', company.id);
      saveData(data);
      return { status: 201, data: { company } };
    }

    if (method === 'DELETE' && path.startsWith('/companies/')) {
      requireRole(session, ['admin']);
      const id = path.split('/')[2];
      const idx = data.companies.findIndex((c) => c.id === id);
      if (idx === -1) throw new ApiError('Company not found', 404);
      data.companies.splice(idx, 1);
      data.drives = data.drives.filter((d) => d.companyId !== id);
      logActivity(data, session.userId, 'DELETE_COMPANY', 'company', id);
      saveData(data);
      return { status: 200, data: { message: 'Company deleted' } };
    }

    if (method === 'GET' && path === '/drives') {
      const limit = parseInt(params.get('limit') || '20', 10);
      const drives = [...data.drives]
        .sort((a, b) => new Date(a.driveDate).getTime() - new Date(b.driveDate).getTime())
        .slice(0, limit)
        .map((d) => ({
          ...d,
          company: (() => {
            const c = getCompany(data, d.companyId)!;
            return { id: c.id, name: c.name, industry: c.industry };
          })(),
        }));
      return { status: 200, data: { drives, total: data.drives.length, page: 1, limit } };
    }

    if (method === 'POST' && path === '/drives') {
      requireRole(session, ['officer', 'admin']);
      const payload = body as {
        companyId: string;
        driveDate: string;
        eligibleDepartments?: string;
        minCgpa?: number;
        roleOffered?: string;
        status?: string;
      };
      const now = new Date().toISOString();
      const drive = {
        id: newId('drive'),
        companyId: payload.companyId,
        driveDate: new Date(payload.driveDate).toISOString(),
        eligibleDepartments: payload.eligibleDepartments ?? null,
        minCgpa: payload.minCgpa ?? null,
        roleOffered: payload.roleOffered ?? null,
        status: payload.status ?? 'upcoming',
        createdAt: now,
        updatedAt: now,
      };
      data.drives.push(drive);
      logActivity(data, session.userId, 'CREATE_DRIVE', 'drive', drive.id);
      saveData(data);
      const company = getCompany(data, drive.companyId)!;
      return {
        status: 201,
        data: { drive: { ...drive, company: { name: company.name } } },
      };
    }

    if (method === 'DELETE' && path.startsWith('/drives/')) {
      requireRole(session, ['admin']);
      const id = path.split('/')[2];
      const idx = data.drives.findIndex((d) => d.id === id);
      if (idx === -1) throw new ApiError('Drive not found', 404);
      data.drives.splice(idx, 1);
      logActivity(data, session.userId, 'DELETE_DRIVE', 'drive', id);
      saveData(data);
      return { status: 200, data: { message: 'Drive deleted' } };
    }

    if (method === 'PUT' && path.startsWith('/applications/')) {
      requireRole(session, ['officer', 'admin']);
      const id = path.split('/')[2];
      const payload = body as { stage?: string; offerStatus?: string; package?: number | null };
      const app = data.applications.find((a) => a.id === id);
      if (!app) throw new ApiError('Application not found', 404);
      if (payload.stage) app.stage = payload.stage;
      if (payload.offerStatus) app.offerStatus = payload.offerStatus;
      if (payload.package !== undefined) app.package = payload.package;
      app.updatedAt = new Date().toISOString();
      logActivity(data, session.userId, 'UPDATE_APPLICATION', 'application', id);
      saveData(data);
      return { status: 200, data: { application: enrichApplication(data, app) } };
    }

    if (method === 'GET' && path === '/admin/users') {
      requireRole(session, ['admin']);
      const users = data.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        student: u.studentId
          ? (() => {
              const s = data.students.find((st) => st.id === u.studentId)!;
              return { rollNumber: s.rollNumber, department: s.department, cgpa: s.cgpa };
            })()
          : null,
      }));
      return { status: 200, data: { users } };
    }

    if (method === 'PUT' && path.match(/^\/admin\/users\/[^/]+\/deactivate$/)) {
      requireRole(session, ['admin']);
      const id = path.split('/')[3];
      if (id === session.userId) throw new ApiError('Cannot deactivate your own account', 400);
      const user = data.users.find((u) => u.id === id);
      if (!user) throw new ApiError('User not found', 404);
      user.isActive = false;
      logActivity(data, session.userId, 'DEACTIVATE_USER', 'user', id);
      saveData(data);
      return { status: 200, data: { message: 'User deactivated and all sessions revoked' } };
    }

    if (method === 'PUT' && path.match(/^\/admin\/users\/[^/]+\/role$/)) {
      requireRole(session, ['admin']);
      const id = path.split('/')[3];
      const { role } = body as { role: 'student' | 'officer' | 'admin' };
      const user = data.users.find((u) => u.id === id);
      if (!user) throw new ApiError('User not found', 404);
      user.role = role;
      logActivity(data, session.userId, 'UPDATE_USER_ROLE', 'user', id);
      saveData(data);
      return { status: 200, data: { user: { id: user.id, role: user.role } } };
    }

    if (method === 'GET' && path === '/admin/audit') {
      requireRole(session, ['admin']);
      const limit = parseInt(params.get('limit') || '50', 10);
      const logs = data.activityLogs.slice(0, limit).map((log) => ({
        ...log,
        user: log.userId
          ? (() => {
              const u = data.users.find((usr) => usr.id === log.userId)!;
              return { name: u.name, role: u.role, email: u.email };
            })()
          : null,
      }));
      return { status: 200, data: { logs, total: data.activityLogs.length, page: 1 } };
    }

    if (method === 'POST' && path === '/admin/students') {
      requireRole(session, ['admin']);
      const payload = body as {
        name: string;
        email: string;
        password: string;
        rollNumber: string;
        department: string;
        cgpa: number;
        batchYear: number;
        phone?: string;
        backlogCount?: number;
      };
      if (data.users.some((u) => u.email === payload.email)) throw new ApiError('Email already registered', 409);
      if (data.students.some((s) => s.rollNumber === payload.rollNumber)) throw new ApiError('Roll number already exists', 409);

      const now = new Date().toISOString();
      const student = {
        id: newId('student'),
        rollNumber: payload.rollNumber,
        fullName: payload.name,
        department: payload.department,
        cgpa: payload.cgpa,
        batchYear: payload.batchYear,
        phone: payload.phone ?? null,
        backlogCount: payload.backlogCount ?? 0,
        createdAt: now,
        updatedAt: now,
      };
      const user = {
        id: newId('user'),
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: 'student' as const,
        studentId: student.id,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      data.students.push(student);
      data.users.push(user);
      logActivity(data, session.userId, 'ADD_STUDENT', 'user', user.id);
      saveData(data);
      return { status: 201, data: { user: { id: user.id, name: user.name, email: user.email } } };
    }

    if (method === 'POST' && path === '/assistant/query') {
      requireRole(session, ['student']);
      const { message } = body as { message: string };
      const user = data.users.find((u) => u.id === session.userId);
      const student = data.students.find((s) => s.id === user?.studentId);
      const { intent, confidence } = detectIntent(message);

      let responseText = FALLBACK_RESPONSE;
      let responseData: Record<string, unknown> = {};

      if (intent && student) {
        const applications = data.applications
          .filter((a) => a.studentId === student.id)
          .map((a) => {
            const driveInfo = getDriveWithCompany(data, a.driveId);
            return {
              company: driveInfo?.company?.name ?? 'Unknown',
              stage: a.stage,
              offerStatus: a.offerStatus,
              package: a.package ?? undefined,
            };
          });

        if (intent === 'company_count') {
          responseData = { count: data.companies.length };
        } else {
          responseData = { applications };
        }
        responseText = buildResponse(intent, responseData);
      }

      // Guard: older stored sessions may not have assistantLogs yet
      if (!Array.isArray(data.assistantLogs)) data.assistantLogs = [];

      data.assistantLogs.unshift({
        id: newId('alog'),
        userId: session.userId,
        rawQuery: message,
        detectedIntent: intent,
        confidence,
        responseText,
        createdAt: new Date().toISOString(),
      });
      saveData(data);

      return { status: 200, data: { intent, confidence, response: responseText } };
    }

    throw new ApiError('Not found', 404);
  } catch (err) {
    if (err instanceof ApiError) {
      return { status: err.status, data: { error: err.message } };
    }
    throw err;
  }
}
