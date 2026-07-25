export type UserRole = 'student' | 'officer' | 'admin';

export interface Student {
  id: string;
  rollNumber: string;
  fullName: string;
  department: string;
  cgpa: number;
  batchYear: number;
  phone?: string | null;
  backlogCount: number;
  resumeUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string | null;
  packageMin?: number | null;
  packageMax?: number | null;
  website?: string | null;
  createdAt: string;
}

export interface PlacementDrive {
  id: string;
  companyId: string;
  driveDate: string;
  eligibleDepartments?: string | null;
  minCgpa?: number | null;
  roleOffered?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  studentId: string;
  driveId: string;
  stage: string;
  offerStatus: string;
  package?: number | null;
  appliedOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AssistantLog {
  id: string;
  userId: string;
  rawQuery: string;
  detectedIntent?: string | null;
  confidence?: number | null;
  responseText: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppData {
  users: User[];
  students: Student[];
  companies: Company[];
  drives: PlacementDrive[];
  applications: Application[];
  activityLogs: ActivityLog[];
  assistantLogs: AssistantLog[];
  notifications: Notification[];
}

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}
