import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Briefcase, FileText, Activity, Plus, Search, Edit2, Trash2, CheckCircle,
  XCircle, AlertCircle, Filter, DollarSign, Calendar, Eye
} from 'lucide-react';

interface KPIs {
  totalStudents: number;
  totalApplications: number;
  totalCompanies: number;
  offers: number;
  placementRate: string;
  avgPackage: number | null;
  highestPackage: number | null;
}

interface ChartData {
  stageBreakdown: Array<{ stage: string; _count: { id: number } }>;
  deptWise: Array<{ department: string; _count: { id: number } }>;
}

interface ApplicationReport {
  applicationId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  cgpa: number;
  company: string;
  industry: string;
  driveDate: string;
  stage: string;
  offerStatus: string;
  package: number | null;
  appliedOn: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'officer' | 'admin';
  isActive: boolean;
  createdAt: string;
  student?: {
    rollNumber: string;
    department: string;
    cgpa: number;
  } | null;
}

interface AuditLogRecord {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    name: string;
    role: string;
    email: string;
  } | null;
}

interface CompanyRecord {
  id: string;
  name: string;
  industry: string | null;
  packageMin: number | null;
  packageMax: number | null;
  website: string | null;
}

interface DriveRecord {
  id: string;
  companyId: string;
  driveDate: string;
  eligibleDepartments: string | null;
  minCgpa: number | null;
  roleOffered: string | null;
  status: string;
  company: {
    id: string;
    name: string;
    industry: string | null;
  };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200',
  shortlisted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  interview: 'bg-purple-50 text-purple-700 border-purple-200',
  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  selected: 'bg-green-50 text-green-700 border-green-200',
  offer_accepted: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  offer_declined: 'bg-amber-100 text-amber-800 border-amber-300',
  rejected: 'bg-rose-100 text-rose-800 border-rose-300',
};

function fmt(v: number | null) {
  if (v === null || v === undefined) return '—';
  return `₹${(v / 100000).toFixed(1)}L`;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'placements' | 'drives' | 'users' | 'audit'>('overview');
  
  // State variables
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [applications, setApplications] = useState<ApplicationReport[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [drives, setDrives] = useState<DriveRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filters
  const [placementSearch, setPlacementSearch] = useState('');
  const [placementStageFilter, setPlacementStageFilter] = useState('');
  const [placementStatusFilter, setPlacementStatusFilter] = useState('');

  // Modals & Editors state
  const [editAppModal, setEditAppModal] = useState<ApplicationReport | null>(null);
  const [appStage, setAppStage] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [appPkg, setAppPkg] = useState<number | ''>('');

  // Company Modal state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compIndustry, setCompIndustry] = useState('');
  const [compMinPkg, setCompMinPkg] = useState<number | ''>('');
  const [compMaxPkg, setCompMaxPkg] = useState<number | ''>('');
  const [compWebsite, setCompWebsite] = useState('');

  // Drive Modal state
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveCompanyId, setDriveCompanyId] = useState('');
  const [driveDate, setDriveDate] = useState('');
  const [driveEligibleDept, setDriveEligibleDept] = useState('');
  const [driveMinCgpa, setDriveMinCgpa] = useState<number | ''>('');
  const [driveRole, setDriveRole] = useState('');
  const [driveStatus, setDriveStatus] = useState('upcoming');

  // Student Modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studName, setStudName] = useState('');
  const [studEmail, setStudEmail] = useState('');
  const [studPassword, setStudPassword] = useState('');
  const [studRollNumber, setStudRollNumber] = useState('');
  const [studDept, setStudDept] = useState('');
  const [studCgpa, setStudCgpa] = useState<number | ''>('');
  const [studBatchYear, setStudBatchYear] = useState<number | ''>('');
  const [studPhone, setStudPhone] = useState('');
  const [studBacklogs, setStudBacklogs] = useState<number | ''>(0);

  const flashMessage = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const fetchOverview = async () => {
    try {
      const { data } = await api.get<{ kpis: KPIs; charts: ChartData }>('/dashboard/admin');
      setKpis(data.kpis);
      setCharts(data.charts);
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to load dashboard statistics', true);
    }
  };

  const fetchPlacements = async () => {
    try {
      const { data } = await api.get<{ report: ApplicationReport[] }>('/admin/reports');
      setApplications(data.report);
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to load placement reports', true);
    }
  };

  const fetchCompaniesAndDrives = async () => {
    try {
      const [compRes, driveRes] = await Promise.all([
        api.get<{ companies: CompanyRecord[] }>('/companies?limit=100'),
        api.get<{ drives: DriveRecord[] }>('/drives?limit=100')
      ]);
      setCompanies(compRes.data.companies);
      setDrives(driveRes.data.drives);
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to load companies or drives', true);
    }
  };

  const fetchUsers = async () => {
    if (user?.role !== 'admin') return;
    try {
      const { data } = await api.get<{ users: UserRecord[] }>('/admin/users');
      setUsersList(data.users);
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to load users list', true);
    }
  };

  const fetchAuditLogs = async () => {
    if (user?.role !== 'admin') return;
    try {
      const { data } = await api.get<{ logs: AuditLogRecord[] }>('/admin/audit?limit=100');
      setAuditLogs(data.logs);
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to load audit logs', true);
    }
  };

  // Initial Load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOverview(),
      fetchPlacements(),
      fetchCompaniesAndDrives(),
      fetchUsers(),
      fetchAuditLogs()
    ]).finally(() => setLoading(false));
  }, [user]);

  // Compute duplicate names map for disambiguation suffix
  const duplicateNames = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((a) => {
      counts[a.studentName] = (counts[a.studentName] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAppModal) return;
    try {
      const pkgVal = ['offer', 'selected', 'offer_accepted'].includes(appStage) || ['selected', 'offer_accepted'].includes(appStatus)
        ? (appPkg === '' ? null : Number(appPkg))
        : null;

      await api.put(`/applications/${editAppModal.applicationId}`, {
        stage: appStage,
        offerStatus: appStatus,
        package: pkgVal
      });

      flashMessage('Application updated successfully');
      setEditAppModal(null);
      // Reload placements and overview
      fetchPlacements();
      fetchOverview();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to update application', true);
    }
  };

  const handleDeactivateUser = async (targetUserId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user and revoke all active sessions?')) return;
    try {
      await api.put(`/admin/users/${targetUserId}/deactivate`);
      flashMessage('User deactivated and all sessions revoked');
      fetchUsers();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to deactivate user', true);
    }
  };

  const handleChangeUserRole = async (targetUserId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${targetUserId}/role`, { role: newRole });
      flashMessage(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to update user role', true);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/companies', {
        name: compName,
        industry: compIndustry || undefined,
        packageMin: compMinPkg !== '' ? Number(compMinPkg) : undefined,
        packageMax: compMaxPkg !== '' ? Number(compMaxPkg) : undefined,
        website: compWebsite || undefined
      });
      flashMessage('Company created successfully');
      setShowCompanyModal(false);
      // Reset
      setCompName('');
      setCompIndustry('');
      setCompMinPkg('');
      setCompMaxPkg('');
      setCompWebsite('');
      // Reload
      fetchCompaniesAndDrives();
      fetchOverview();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to create company', true);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalCompanyId = driveCompanyId;
      if (driveCompanyId === 'new_company') {
        const { data } = await api.post<{ company: CompanyRecord }>('/companies', {
          name: compName,
          industry: compIndustry || undefined,
          packageMin: compMinPkg !== '' ? Number(compMinPkg) : undefined,
          packageMax: compMaxPkg !== '' ? Number(compMaxPkg) : undefined,
          website: compWebsite || undefined
        });
        finalCompanyId = data.company.id;
      }

      await api.post('/drives', {
        companyId: finalCompanyId,
        driveDate,
        eligibleDepartments: driveEligibleDept || undefined,
        minCgpa: driveMinCgpa !== '' ? Number(driveMinCgpa) : undefined,
        roleOffered: driveRole || undefined,
        status: driveStatus
      });
      flashMessage('Placement drive created successfully');
      setShowDriveModal(false);
      
      // Reset drive fields
      setDriveCompanyId('');
      setDriveDate('');
      setDriveEligibleDept('');
      setDriveMinCgpa('');
      setDriveRole('');
      setDriveStatus('upcoming');
      
      // Reset company fields
      setCompName('');
      setCompIndustry('');
      setCompMinPkg('');
      setCompMaxPkg('');
      setCompWebsite('');

      // Reload
      fetchCompaniesAndDrives();
      fetchOverview();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to create drive', true);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', {
        name: studName,
        email: studEmail,
        password: studPassword,
        rollNumber: studRollNumber,
        department: studDept,
        cgpa: Number(studCgpa),
        batchYear: Number(studBatchYear),
        phone: studPhone || undefined,
        backlogCount: studBacklogs !== '' ? Number(studBacklogs) : 0
      });
      flashMessage('Student added successfully');
      setShowStudentModal(false);
      // Reset
      setStudName('');
      setStudEmail('');
      setStudPassword('');
      setStudRollNumber('');
      setStudDept('');
      setStudCgpa('');
      setStudBatchYear('');
      setStudPhone('');
      setStudBacklogs(0);
      // Reload
      fetchUsers();
      fetchOverview();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to add student', true);
    }
  };

  const handleDeleteDrive = async (driveId: string) => {
    if (!window.confirm('Are you sure you want to delete this drive?')) return;
    try {
      await api.delete(`/drives/${driveId}`);
      flashMessage('Drive deleted successfully');
      fetchCompaniesAndDrives();
      fetchOverview();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to delete drive', true);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm('Are you sure you want to delete this company? All associated drives will also be impacted.')) return;
    try {
      await api.delete(`/companies/${companyId}`);
      flashMessage('Company deleted successfully');
      fetchCompaniesAndDrives();
      fetchOverview();
    } catch (err: any) {
      flashMessage(err.response?.data?.error || 'Failed to delete company', true);
    }
  };

  // Filter applications list
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.studentName.toLowerCase().includes(placementSearch.toLowerCase()) ||
        app.company.toLowerCase().includes(placementSearch.toLowerCase()) ||
        app.rollNumber.toLowerCase().includes(placementSearch.toLowerCase());
      
      const matchStage = placementStageFilter ? app.stage === placementStageFilter : true;
      const matchStatus = placementStatusFilter ? app.offerStatus === placementStatusFilter : true;

      return matchSearch && matchStage && matchStatus;
    });
  }, [applications, placementSearch, placementStageFilter, placementStatusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white" aria-busy="true">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
          <p className="text-slate-400 font-medium">Securing connection and loading portals...</p>
        </div>
      </div>
    );
  }

  const stageData = charts?.stageBreakdown.map((s) => ({
    name: s.stage,
    count: s._count.id,
  })) ?? [];

  const deptData = charts?.deptWise.map((d) => ({
    name: d.department,
    students: d._count.id,
  })) ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl">🎓</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Placement Tracker
            </h1>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider capitalize">
              {user?.role} Portal
            </p>
          </div>
        </div>

        {/* Global Success / Error Toast notification */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col gap-2 max-w-md w-full px-4 z-50 pointer-events-none">
          {successMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 animate-pulse pointer-events-auto">
              <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 animate-bounce pointer-events-auto">
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs bg-slate-800 hover:bg-rose-900/40 hover:text-rose-200 text-slate-300 border border-slate-700 hover:border-rose-700/50 px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-ping"></span>
            Sign out
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-slate-900/30 border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: Briefcase },
            { id: 'placements', label: 'Applications', icon: FileText },
            { id: 'drives', label: 'Drives & Companies', icon: Calendar },
            { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
            { id: 'audit', label: 'Audit Logs', icon: Activity, adminOnly: true },
          ].map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Dashboard Main Area */}
        <main className="flex-1 p-6 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Stats Section */}
              <section aria-label="Key Performance Indicators">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {[
                    { label: 'Students', value: kpis?.totalStudents ?? '—', color: 'text-slate-100', icon: Users },
                    { label: 'Applications', value: kpis?.totalApplications ?? '—', color: 'text-slate-100', icon: FileText },
                    { label: 'Companies', value: kpis?.totalCompanies ?? '—', color: 'text-slate-100', icon: Briefcase },
                    { label: 'Offers Released', value: kpis?.offers ?? '—', color: 'text-emerald-400', icon: CheckCircle },
                    { label: 'Placement Rate', value: kpis?.placementRate ?? '—', color: 'text-indigo-400', icon: Activity },
                    { label: 'Avg Package', value: fmt(kpis?.avgPackage ?? null), color: 'text-slate-200', icon: DollarSign },
                    { label: 'Highest Package', value: fmt(kpis?.highestPackage ?? null), color: 'text-violet-400', icon: DollarSign },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{item.label}</span>
                          <Icon size={14} className="text-slate-600" />
                        </div>
                        <p className={`text-xl font-extrabold mt-3 tracking-tight ${item.color}`}>{String(item.value)}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Applications by Stage Chart */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Applications by Stage</h2>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 rounded-full">Real-time</span>
                  </div>
                  {stageData.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-slate-500 text-sm">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Students by Dept Chart */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Students by Department</h2>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 rounded-full">All Cohorts</span>
                  </div>
                  {deptData.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-slate-500 text-sm">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={deptData} dataKey="students" nameKey="name" outerRadius={85} label={{ fill: '#94a3b8', fontSize: 11 }} stroke="#0f172a" strokeWidth={2}>
                          {deptData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLACEMENTS / APPLICATIONS */}
          {activeTab === 'placements' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-200">Placement Applications</h2>
                  <p className="text-xs text-slate-500">Monitor and update application stages, offer statuses, and custom package amounts.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search student, roll, company..."
                      value={placementSearch}
                      onChange={(e) => setPlacementSearch(e.target.value)}
                      className="bg-slate-900 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs w-64 text-slate-200 placeholder-slate-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
                    <Filter size={12} className="text-slate-500" />
                    <select
                      value={placementStageFilter}
                      onChange={(e) => setPlacementStageFilter(e.target.value)}
                      className="bg-transparent text-[11px] focus:outline-none text-slate-300"
                    >
                      <option value="">All Stages</option>
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
                    <Filter size={12} className="text-slate-500" />
                    <select
                      value={placementStatusFilter}
                      onChange={(e) => setPlacementStatusFilter(e.target.value)}
                      className="bg-transparent text-[11px] focus:outline-none text-slate-300"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                      <option value="offer_accepted">Offer Accepted</option>
                      <option value="offer_declined">Offer Declined</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Suffix Roll Number Notice (Requirement 2.5) */}
              <div className="bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-xs rounded-xl px-4 py-3 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block mb-0.5">Automated Identity Disambiguation Active</span>
                  <span>If multiple students share the exact same display name, their unique roll numbers will automatically append to their names (e.g. `Riya Sharma (21CS045)`) in compliance with SIH 2026 specifications.</span>
                </div>
              </div>

              {/* Applications Table */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Student Name</th>
                        <th className="px-5 py-3.5">Roll Number</th>
                        <th className="px-5 py-3.5">Dept</th>
                        <th className="px-5 py-3.5">CGPA</th>
                        <th className="px-5 py-3.5">Company</th>
                        <th className="px-5 py-3.5">Drive Date</th>
                        <th className="px-5 py-3.5">Stage</th>
                        <th className="px-5 py-3.5">Offer Status</th>
                        <th className="px-5 py-3.5">Package</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-5 py-12 text-center text-slate-500">
                            No applications found matching search filters.
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => {
                          // Requirement 2.5: check if student name has duplicate entries in dashboard data
                          const isDup = duplicateNames[app.studentName] > 1;
                          const displayName = isDup ? `${app.studentName} (${app.rollNumber})` : app.studentName;

                          return (
                            <tr key={app.applicationId} className="hover:bg-slate-900/30 transition duration-150">
                              <td className="px-5 py-4 font-semibold text-slate-200">
                                {displayName}
                              </td>
                              <td className="px-5 py-4 text-slate-400 font-mono">{app.rollNumber}</td>
                              <td className="px-5 py-4 text-slate-400">{app.department}</td>
                              <td className="px-5 py-4 font-medium text-slate-300">{app.cgpa.toFixed(2)}</td>
                              <td className="px-5 py-4 font-semibold text-indigo-400">{app.company}</td>
                              <td className="px-5 py-4 text-slate-400 font-mono">
                                {new Date(app.driveDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STAGE_COLORS[app.stage] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                  {app.stage}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[app.offerStatus] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                  {app.offerStatus.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-5 py-4 font-bold text-emerald-400">
                                {fmt(app.package)}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setEditAppModal(app);
                                    setAppStage(app.stage);
                                    setAppStatus(app.offerStatus);
                                    setAppPkg(app.package || '');
                                  }}
                                  className="text-[10px] bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ml-auto"
                                >
                                  <Edit2 size={10} />
                                  Edit Status
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DRIVES & COMPANIES */}
          {activeTab === 'drives' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Two Column Section: Placement Drives & Companies */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Sub-section: Placement Drives */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-200">Active Placement Drives</h3>
                      <p className="text-[11px] text-slate-500">Upcoming and current recruitment schedules.</p>
                    </div>
                    <button
                      onClick={() => setShowDriveModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Drive
                    </button>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="overflow-y-auto max-h-[500px]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Role Offered</th>
                            <th className="px-4 py-3">Min CGPA</th>
                            <th className="px-4 py-3">Drive Date</th>
                            <th className="px-4 py-3">Status</th>
                            {user?.role === 'admin' && <th className="px-4 py-3 text-right">Delete</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {drives.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No drives created yet.</td>
                            </tr>
                          ) : (
                            drives.map((d) => (
                              <tr key={d.id} className="hover:bg-slate-900/20">
                                <td className="px-4 py-3 font-semibold text-slate-200">{d.company?.name}</td>
                                <td className="px-4 py-3 text-slate-400">{d.roleOffered || '—'}</td>
                                <td className="px-4 py-3 font-mono text-slate-300">{d.minCgpa ? d.minCgpa.toFixed(1) : '—'}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono">
                                  {new Date(d.driveDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize border ${
                                    d.status === 'completed'
                                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                                      : d.status === 'ongoing'
                                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                                      : 'bg-blue-950/40 text-blue-400 border-blue-900/50'
                                  }`}>
                                    {d.status}
                                  </span>
                                </td>
                                {user?.role === 'admin' && (
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => handleDeleteDrive(d.id)}
                                      className="text-rose-400 hover:text-rose-300 p-1 transition"
                                      title="Delete Drive"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sub-section: Companies */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-200">Registered Companies</h3>
                      <p className="text-[11px] text-slate-500">Corporate partners offering placement opportunities.</p>
                    </div>
                    <button
                      onClick={() => setShowCompanyModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Company
                    </button>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="overflow-y-auto max-h-[500px]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider sticky top-0">
                          <tr>
                            <th className="px-4 py-3">Company Name</th>
                            <th className="px-4 py-3">Industry</th>
                            <th className="px-4 py-3">Package Range</th>
                            <th className="px-4 py-3">Website</th>
                            {user?.role === 'admin' && <th className="px-4 py-3 text-right">Delete</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {companies.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No companies added yet.</td>
                            </tr>
                          ) : (
                            companies.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-900/20">
                                <td className="px-4 py-3 font-semibold text-indigo-400">{c.name}</td>
                                <td className="px-4 py-3 text-slate-400">{c.industry || '—'}</td>
                                <td className="px-4 py-3 text-slate-300 font-medium">
                                  {c.packageMin || c.packageMax
                                    ? `${fmt(c.packageMin)} - ${fmt(c.packageMax)}`
                                    : '—'}
                                </td>
                                <td className="px-4 py-3 text-indigo-500 font-mono text-[10px] truncate max-w-[120px]">
                                  {c.website ? (
                                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                      <Eye size={10} /> Link
                                    </a>
                                  ) : '—'}
                                </td>
                                {user?.role === 'admin' && (
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => handleDeleteCompany(c.id)}
                                      className="text-rose-400 hover:text-rose-300 p-1 transition"
                                      title="Delete Company"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: USER MANAGEMENT (Admin Only) */}
          {activeTab === 'users' && user?.role === 'admin' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-200">User Session & Role Controls</h2>
                  <p className="text-xs text-slate-500">Revoke permissions, update access privileges, or trigger full session invalidations.</p>
                </div>
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                >
                  <Plus size={14} /> Add Student
                </button>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-4">User Details</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Current Role</th>
                      <th className="px-5 py-4">Registration Date</th>
                      <th className="px-5 py-4">Account Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No users found.</td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/20">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-200">{u.name}</div>
                            {u.student?.rollNumber && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Student: {u.student.rollNumber} | CGPA: {u.student.cgpa.toFixed(2)} | Dept: {u.student.department}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono">{u.email}</td>
                          <td className="px-5 py-4 text-slate-300 capitalize">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                              disabled={u.id === user.id}
                              className="bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
                            >
                              <option value="student">Student</option>
                              <option value="officer">Placement Officer</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              u.isActive
                                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
                                : 'bg-rose-950/30 text-rose-400 border-rose-900/50'
                            }`}>
                              {u.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeactivateUser(u.id)}
                              disabled={!u.isActive || u.id === user.id}
                              className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center gap-1 ml-auto ${
                                !u.isActive || u.id === user.id
                                  ? 'bg-slate-900/20 text-slate-600 border-slate-850 cursor-not-allowed'
                                  : 'bg-rose-950/40 border-rose-900/50 text-rose-400 hover:bg-rose-900 hover:text-white'
                              }`}
                            >
                              <XCircle size={10} /> Deactivate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS (Admin Only) */}
          {activeTab === 'audit' && user?.role === 'admin' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-slate-200">System Activity Audit Logs</h2>
                <p className="text-xs text-slate-500">Immutable chronological record of administrative and placement activities.</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-4">Triggered By</th>
                      <th className="px-5 py-4">Action</th>
                      <th className="px-5 py-4">Impacted Entity</th>
                      <th className="px-5 py-4">IP Address</th>
                      <th className="px-5 py-4 text-right">Logged Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No logs found in this query scope.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/20">
                          <td className="px-5 py-4 text-slate-300">
                            {log.user ? (
                              <div>
                                <span className="font-semibold">{log.user.name}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5 capitalize">({log.user.role})</span>
                              </div>
                            ) : (
                              <span className="text-slate-600">Anonymous / System</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-indigo-400 font-bold">{log.action}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-[10px] uppercase">
                            {log.entityType ? `${log.entityType} (${log.entityId?.slice(0, 8)}...)` : '—'}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-[10px]">
                            {log.ipAddress || '—'}
                          </td>
                          <td className="px-5 py-4 text-right text-slate-500 text-[10px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 flex items-center justify-between text-[10px] text-slate-600">
        <p>© 2026 Smart India Hackathon internal assessment. All rights reserved.</p>
        <p className="font-mono">Data persisted in browser cookies · Vercel deployment ready</p>
      </footer>

      {/* MODAL 1: EDIT APPLICATION DETAILS */}
      {editAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleUpdateApplication} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
              <Edit2 size={16} className="text-indigo-500" />
              Update Application Status
            </h3>
            <p className="text-[11px] text-slate-500">
              Editing application for <span className="font-semibold text-slate-300">{editAppModal.studentName}</span> at <span className="font-semibold text-slate-300">{editAppModal.company}</span>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recruitment Stage</label>
                <select
                  value={appStage}
                  onChange={(e) => setAppStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Offer Selection Status</label>
                <select
                  value={appStatus}
                  onChange={(e) => setAppStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer_accepted">Offer Accepted</option>
                  <option value="offer_declined">Offer Declined</option>
                </select>
              </div>

              {/* Requirement 2.4: package only editable/visible if offer is selected/accepted */}
              {['offer', 'selected', 'offer_accepted'].includes(appStage) || ['selected', 'offer_accepted'].includes(appStatus) ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Annual Package (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 600000"
                    value={appPkg}
                    onChange={(e) => setAppPkg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    min={0}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditAppModal(null)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: ADD NEW COMPANY */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleCreateCompany} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
              <Plus size={16} className="text-indigo-500" />
              Register New Company
            </h3>
            <p className="text-[11px] text-slate-500">Provide baseline specs for a placement recruitment partner.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google India"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Industry Vertical</label>
                <input
                  type="text"
                  placeholder="e.g. IT Services, FinTech"
                  value={compIndustry}
                  onChange={(e) => setCompIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min Package (INR)</label>
                  <input
                    type="number"
                    placeholder="Min Package"
                    value={compMinPkg}
                    onChange={(e) => setCompMinPkg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Package (INR)</label>
                  <input
                    type="number"
                    placeholder="Max Package"
                    value={compMaxPkg}
                    onChange={(e) => setCompMaxPkg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Website</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCompanyModal(false)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Register Company
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ADD NEW PLACEMENT DRIVE */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleCreateDrive} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
              <Plus size={16} className="text-indigo-500" />
              Schedule Placement Drive
            </h3>
            <p className="text-[11px] text-slate-500">Initiate a recruitment drive for a registered company.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Partner</label>
                <select
                  required
                  value={driveCompanyId}
                  onChange={(e) => setDriveCompanyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Company...</option>
                  <option value="new_company" className="text-indigo-400 font-semibold">+ Add New Company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {driveCompanyId === 'new_company' && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">New Company Details</p>
                  
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google India"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Industry Vertical</label>
                    <input
                      type="text"
                      placeholder="e.g. IT Services, FinTech"
                      value={compIndustry}
                      onChange={(e) => setCompIndustry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min Package</label>
                      <input
                        type="number"
                        placeholder="Min Package"
                        value={compMinPkg}
                        onChange={(e) => setCompMinPkg(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Package</label>
                      <input
                        type="number"
                        placeholder="Max Package"
                        value={compMaxPkg}
                        onChange={(e) => setCompMaxPkg(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={compWebsite}
                      onChange={(e) => setCompWebsite(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Role/Designation Offered</label>
                <input
                  type="text"
                  placeholder="e.g. SDE-1"
                  value={driveRole}
                  onChange={(e) => setDriveRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min Eligible CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 7.5"
                    value={driveMinCgpa}
                    onChange={(e) => setDriveMinCgpa(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Drive Schedule Date</label>
                  <input
                    type="date"
                    required
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Eligible Departments (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. CSE, IT, ECE"
                  value={driveEligibleDept}
                  onChange={(e) => setDriveEligibleDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Initial Status</label>
                <select
                  value={driveStatus}
                  onChange={(e) => setDriveStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Schedule Drive
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: ADD NEW STUDENT */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleCreateStudent} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5">
              <Plus size={16} className="text-indigo-500" />
              Register New Student
            </h3>
            <p className="text-[11px] text-slate-500">Create a student account and corresponding portal user.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Riya Sharma"
                  value={studName}
                  onChange={(e) => setStudName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={studEmail}
                    onChange={(e) => setStudEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 chars"
                    value={studPassword}
                    onChange={(e) => setStudPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21CS045"
                    value={studRollNumber}
                    onChange={(e) => setStudRollNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={studDept}
                    onChange={(e) => setStudDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    placeholder="e.g. 8.5"
                    value={studCgpa}
                    onChange={(e) => setStudCgpa(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Batch Year</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2026"
                    value={studBatchYear}
                    onChange={(e) => setStudBatchYear(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={studPhone}
                    onChange={(e) => setStudPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={studBacklogs}
                    onChange={(e) => setStudBacklogs(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="bg-slate-800 hover:bg-slate-755 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
