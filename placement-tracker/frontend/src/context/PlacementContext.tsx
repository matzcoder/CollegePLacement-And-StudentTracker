import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface ApplicationItem {
  id: string;
  applicationId?: string;
  studentId: string;
  driveId: string;
  stage: string;
  rawStage?: string;
  offerStatus: string;
  rawOfferStatus?: string;
  package?: number | null;
  packageOffered?: number | null;
  outcome?: string;
  appliedOn: string;
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  rollNumber?: string;
  department?: string;
  cgpa?: number;
  company?: string;
  industry?: string;
  driveDate?: string;
  student?: {
    id: string;
    fullName: string;
    rollNumber: string;
    department: string;
    cgpa?: number;
  };
  drive?: {
    id: string;
    roleTitle?: string;
    roleOffered?: string;
    driveDate?: string;
    status?: string;
    company?: {
      id?: string;
      name: string;
      industry?: string;
      website?: string;
    };
  };
}

export interface DriveItem {
  id: string;
  companyId: string;
  roleTitle?: string;
  roleOffered?: string;
  minCgpa?: number;
  driveDate?: string;
  status?: string;
  eligibleDepts?: string;
  eligibleDepartments?: string;
  applicationCount?: number;
  company?: {
    id?: string;
    name: string;
    industry?: string;
    website?: string;
    packageMin?: number;
    packageMax?: number;
  };
}

export interface PlacementStats {
  totalStudents: number;
  totalApplications: number;
  totalCompanies: number;
  offers: number;
  placedCount?: number;
  placementRate: string;
  avgPackage: number | null;
  highestPackage: number | null;
  stageBreakdown?: Array<{ stage: string; _count: { id: number } }>;
  deptWise?: Array<{ department: string; _count: { id: number } }>;
}

export interface PlacementContextValue {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  applications: ApplicationItem[];
  drives: DriveItem[];
  stats: PlacementStats | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  updateApplicationStage: (
    applicationId: string,
    stage: string,
    offerStatus?: string,
    packageAmount?: number | null
  ) => Promise<any>;
  applyToDrive: (driveId: string) => Promise<any>;
  createDrive: (driveData: any) => Promise<any>;
  deleteDrive: (driveId: string) => Promise<any>;
}

const PlacementContext = createContext<PlacementContextValue | null>(null);

export function PlacementProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [applications, setApplications] = useState<ApplicationItem[]>(() => {
    try {
      const cached = localStorage.getItem('cached_applications');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [drives, setDrives] = useState<DriveItem[]>(() => {
    try {
      const cached = localStorage.getItem('cached_drives');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<PlacementStats | null>(() => {
    try {
      const cached = localStorage.getItem('cached_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, appsRes, drivesRes, statsRes] = await Promise.all([
        api.get('/auth/me').catch(() => ({ data: null })),
        api.get<ApplicationItem[]>('/applications').catch(() => ({ data: [] })),
        api.get<DriveItem[]>('/drives').catch(() => ({ data: [] })),
        api.get<PlacementStats>('/applications/stats').catch(() => ({ data: null })),
      ]);

      if (userRes.data) {
        setCurrentUser(userRes.data);
        localStorage.setItem('cached_user', JSON.stringify(userRes.data));
      }

      if (appsRes.data && Array.isArray(appsRes.data)) {
        setApplications(appsRes.data);
        localStorage.setItem('cached_applications', JSON.stringify(appsRes.data));
      }

      if (drivesRes.data && Array.isArray(drivesRes.data)) {
        setDrives(drivesRes.data);
        localStorage.setItem('cached_drives', JSON.stringify(drivesRes.data));
      }

      if (statsRes.data) {
        setStats(statsRes.data);
        localStorage.setItem('cached_stats', JSON.stringify(statsRes.data));
      }
    } catch (err) {
      console.warn('Network unavailable, falling back to local cache', err);
      const cachedApps = localStorage.getItem('cached_applications');
      const cachedDrives = localStorage.getItem('cached_drives');
      const cachedStats = localStorage.getItem('cached_stats');
      const cachedUser = localStorage.getItem('cached_user');
      if (cachedApps) setApplications(JSON.parse(cachedApps));
      if (cachedDrives) setDrives(JSON.parse(cachedDrives));
      if (cachedStats) setStats(JSON.parse(cachedStats));
      if (cachedUser) setCurrentUser(JSON.parse(cachedUser));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const updateApplicationStage = async (
    applicationId: string,
    stage: string,
    offerStatus?: string,
    packageAmount?: number | null
  ) => {
    try {
      // Optimistic UI update
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === applicationId || app.applicationId === applicationId) {
            return {
              ...app,
              stage: stage ? stage.toLowerCase() : app.stage,
              rawStage: stage ? stage.toUpperCase() : app.rawStage,
              offerStatus: offerStatus ? offerStatus.toLowerCase() : app.offerStatus,
              rawOfferStatus: offerStatus ? offerStatus.toUpperCase() : app.rawOfferStatus,
              package: packageAmount !== undefined ? packageAmount : app.package,
              packageOffered: packageAmount !== undefined ? packageAmount : app.packageOffered,
            };
          }
          return app;
        })
      );

      const res = await api.patch(`/applications/${applicationId}/status`, {
        stage,
        offerStatus,
        package: packageAmount,
      });

      await fetchState();
      return res.data;
    } catch (err) {
      console.error('Failed to update application stage:', err);
      await fetchState();
      throw err;
    }
  };

  const applyToDrive = async (driveId: string) => {
    const res = await api.post('/applications', { driveId });
    await fetchState();
    return res.data;
  };

  const createDrive = async (driveData: any) => {
    const res = await api.post('/drives', driveData);
    await fetchState();
    return res.data;
  };

  const deleteDrive = async (driveId: string) => {
    const res = await api.delete(`/drives/${driveId}`);
    await fetchState();
    return res.data;
  };

  return (
    <PlacementContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        applications,
        drives,
        stats,
        loading,
        refreshData: fetchState,
        updateApplicationStage,
        applyToDrive,
        createDrive,
        deleteDrive,
      }}
    >
      {children}
    </PlacementContext.Provider>
  );
}

export const usePlacement = (): PlacementContextValue => {
  const context = useContext(PlacementContext);
  if (!context) {
    throw new Error('usePlacement must be used within a PlacementProvider');
  }
  return context;
};
