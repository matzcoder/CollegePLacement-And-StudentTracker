import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlacement } from '../context/PlacementContext';
import {
  Briefcase, Users, CheckCircle, Clock, Calendar,
  Building2, Search, Filter, Edit3, ArrowUpRight, Plus, RefreshCw, X, AlertCircle
} from 'lucide-react';

const STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'under_review', label: 'Under Review', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'assessment', label: 'Assessment', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'interview', label: 'Interview', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { id: 'offer', label: 'Offered', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'rejected', label: 'Rejected', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

const OFFER_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  { id: 'selected', label: 'Selected / Offered', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' },
  { id: 'offer_accepted', label: 'Offer Accepted', color: 'bg-green-950/60 text-green-300 border-green-700/50' },
  { id: 'offer_declined', label: 'Offer Declined', color: 'bg-amber-950/60 text-amber-300 border-amber-700/50' },
  { id: 'rejected', label: 'Not Offered / Rejected', color: 'bg-rose-950/60 text-rose-300 border-rose-700/50' },
];

export default function OfficerDashboard() {
  const { user, logout } = useAuth();
  const { applications, drives, stats, refreshData, updateApplicationStage, createDrive } = usePlacement();

  const [activeTab, setActiveTab] = useState<'applications' | 'drives'>('applications');
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState('ALL');

  // Edit Stage Modal
  const [editingApp, setEditingApp] = useState<any>(null);
  const [modalStage, setModalStage] = useState('');
  const [modalOfferStatus, setModalOfferStatus] = useState('');
  const [modalPackage, setModalPackage] = useState('');
  const [saving, setSaving] = useState(false);

  // Create Drive Modal
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveForm, setDriveForm] = useState({
    companyId: '',
    roleTitle: '',
    minCgpa: '7.0',
    driveDate: '2026-06-15',
    status: 'Upcoming',
    eligibleDepts: 'CSE,IT,ECE',
  });

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return (applications || []).filter((app: any) => {
      const sName = (app.studentName || app.student?.fullName || '').toLowerCase();
      const rNum = (app.rollNumber || app.student?.rollNumber || '').toLowerCase();
      const comp = (app.company || app.drive?.company?.name || '').toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = sName.includes(query) || rNum.includes(query) || comp.includes(query);
      const matchesStage = selectedStage === 'ALL' || (app.stage || '').toLowerCase() === selectedStage.toLowerCase();
      const matchesComp = selectedCompany === 'ALL' || comp === selectedCompany.toLowerCase();

      return matchesSearch && matchesStage && matchesComp;
    });
  }, [applications, search, selectedStage, selectedCompany]);

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    (applications || []).forEach((a: any) => {
      const c = a.company || a.drive?.company?.name;
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [applications]);

  const handleOpenEdit = (app: any) => {
    setEditingApp(app);
    setModalStage(app.stage || 'applied');
    setModalOfferStatus(app.offerStatus || 'pending');
    setModalPackage(app.package || app.packageOffered ? String((app.package || app.packageOffered) / 100000) : '');
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setSaving(true);
    try {
      const pkgAmount = modalPackage.trim() ? parseFloat(modalPackage) * 100000 : null;
      await updateApplicationStage(
        editingApp.id || editingApp.applicationId,
        modalStage,
        modalOfferStatus,
        pkgAmount
      );
      showToast(`Updated stage for ${editingApp.studentName || editingApp.student?.fullName || 'student'}`);
      setEditingApp(null);
    } catch (err) {
      showToast('Failed to update stage', false);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const firstCompanyId = drives[0]?.companyId || drives[0]?.company?.id;
      await createDrive({
        companyId: driveForm.companyId || firstCompanyId,
        roleTitle: driveForm.roleTitle || 'Graduate Trainee',
        minCgpa: parseFloat(driveForm.minCgpa),
        driveDate: new Date(driveForm.driveDate).toISOString(),
        status: driveForm.status,
        eligibleDepartments: driveForm.eligibleDepts,
      });
      showToast('Placement drive published successfully!');
      setShowDriveModal(false);
    } catch (err) {
      showToast('Failed to create drive', false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Placement Tracker</h1>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
              Placement Officer Portal
            </p>
          </div>
        </div>

        {toast && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border shadow-xl ${
              toast.ok
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
                : 'bg-rose-950/90 text-rose-200 border-rose-700/60'
            }`}
          >
            {toast.ok ? <CheckCircle size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-rose-400" />}
            {toast.msg}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={() => refreshData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Refresh live data"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{user?.name || user?.fullName || 'Placement Officer'}</p>
            <p className="text-[10px] text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-300 border border-slate-700 hover:border-rose-800 px-3 py-1.5 rounded-lg font-bold transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* KPI Row */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Candidates', value: stats?.totalStudents || 28, icon: Users, cls: 'text-slate-100' },
            { label: 'Total Applications', value: applications?.length || 0, icon: Briefcase, cls: 'text-indigo-400' },
            { label: 'Total Offers Released', value: stats?.offers || 0, icon: CheckCircle, cls: 'text-emerald-400' },
            { label: 'Placement Rate', value: stats?.placementRate || '58.0%', icon: ArrowUpRight, cls: 'text-amber-400' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <Icon size={16} className="text-slate-500" />
                </div>
                <p className={`text-3xl font-black ${item.cls}`}>{item.value}</p>
              </div>
            );
          })}
        </section>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'applications'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Candidate Applications ({filteredApps.length})
            </button>
            <button
              onClick={() => setActiveTab('drives')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'drives'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Placement Drives ({drives.length})
            </button>
          </div>

          {activeTab === 'drives' && (
            <button
              onClick={() => setShowDriveModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
            >
              <Plus size={14} /> Add Placement Drive
            </button>
          )}
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <section className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidate name, roll number, or company..."
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs rounded-xl pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Stages</option>
                  <option value="applied">Applied</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="assessment">Assessment</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Companies</option>
                  {uniqueCompanies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Candidate</th>
                      <th className="px-5 py-3.5">Dept / CGPA</th>
                      <th className="px-5 py-3.5">Company & Role</th>
                      <th className="px-5 py-3.5">Stage</th>
                      <th className="px-5 py-3.5">Offer Status</th>
                      <th className="px-5 py-3.5">Package</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          No candidate applications matched the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app: any) => {
                        const stageObj = STAGES.find((s) => s.id === (app.stage || '').toLowerCase()) || {
                          label: app.stage || 'Applied',
                          color: 'bg-slate-800 text-slate-400 border-slate-700',
                        };
                        const offerObj = OFFER_STATUSES.find((o) => o.id === (app.offerStatus || '').toLowerCase()) || {
                          label: app.offerStatus || 'Pending',
                          color: 'bg-slate-800 text-slate-400 border-slate-700',
                        };

                        const sName = app.studentName || app.student?.fullName || 'Candidate';
                        const roll = app.rollNumber || app.student?.rollNumber || '—';
                        const dept = app.department || app.student?.department || '—';
                        const cgpa = app.cgpa || app.student?.cgpa;
                        const comp = app.company || app.drive?.company?.name || 'Company';
                        const role = app.drive?.roleOffered || app.drive?.roleTitle || 'Graduate Trainee';

                        return (
                          <tr key={app.id || app.applicationId} className="hover:bg-slate-900/40 transition">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-200">{sName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{roll}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-300">{dept}</div>
                              <div className="text-[10px] text-indigo-400 font-mono">CGPA: {cgpa || '—'}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-200">{comp}</div>
                              <div className="text-[10px] text-slate-500">{role}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${stageObj.color}`}>
                                {stageObj.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${offerObj.color}`}>
                                {offerObj.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                              {app.package || app.packageOffered
                                ? `₹${(((app.package || app.packageOffered) as number) / 100000).toFixed(1)}L`
                                : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleOpenEdit(app)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition"
                              >
                                <Edit3 size={12} /> Update Stage
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
          </section>
        )}

        {/* Drives Tab */}
        {activeTab === 'drives' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drives.map((d: any) => (
              <div
                key={d.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-white">{d.company?.name || 'Company'}</h3>
                      <p className="text-xs text-indigo-400 font-medium">{d.roleTitle || d.roleOffered}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {d.status || 'Upcoming'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-500" />
                      <span>
                        Drive Date:{' '}
                        <strong className="text-slate-200">
                          {d.driveDate ? new Date(d.driveDate).toLocaleDateString() : 'TBD'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-slate-500" />
                      <span>
                        Min CGPA: <strong className="text-slate-200">{d.minCgpa || '0.0'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-slate-500" />
                      <span>
                        Eligible Branches:{' '}
                        <strong className="text-slate-200">{d.eligibleDepts || d.eligibleDepartments || 'All'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Industry: <span className="text-slate-300">{d.company?.industry || 'IT'}</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {d.company?.packageMin ? `₹${(d.company.packageMin / 100000).toFixed(1)}L+` : 'Open'}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Edit Stage Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">Update Candidate Stage</h3>
                <p className="text-xs text-slate-400">
                  {editingApp.studentName || editingApp.student?.fullName} ({editingApp.company || editingApp.drive?.company?.name})
                </p>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px]">
                  Recruitment Stage
                </label>
                <select
                  value={modalStage}
                  onChange={(e) => setModalStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="applied">Applied</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="assessment">Assessment</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px]">
                  Offer Status
                </label>
                <select
                  value={modalOfferStatus}
                  onChange={(e) => setModalOfferStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="selected">Selected / Offered</option>
                  <option value="offer_accepted">Offer Accepted</option>
                  <option value="offer_declined">Offer Declined</option>
                  <option value="rejected">Not Offered / Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px]">
                  Offered Package (in LPA, e.g. 7.5)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={modalPackage}
                  onChange={(e) => setModalPackage(e.target.value)}
                  placeholder="e.g. 6.5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Drive Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Publish New Placement Drive</h3>
              <button
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Company</label>
                <select
                  value={driveForm.companyId}
                  onChange={(e) => setDriveForm({ ...driveForm, companyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select Company</option>
                  {drives.map((d: any) => (
                    <option key={d.company?.id || d.companyId} value={d.company?.id || d.companyId}>
                      {d.company?.name || 'Company'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Role Title</label>
                <input
                  type="text"
                  value={driveForm.roleTitle}
                  onChange={(e) => setDriveForm({ ...driveForm, roleTitle: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={driveForm.minCgpa}
                    onChange={(e) => setDriveForm({ ...driveForm, minCgpa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Drive Date</label>
                  <input
                    type="date"
                    value={driveForm.driveDate}
                    onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Eligible Branches</label>
                <input
                  type="text"
                  value={driveForm.eligibleDepts}
                  onChange={(e) => setDriveForm({ ...driveForm, eligibleDepts: e.target.value })}
                  placeholder="e.g. CSE,IT,ECE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  Publish Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
