import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlacement } from '../context/PlacementContext';
import {
  GraduationCap, MessageCircle, Building2, Calendar, ChevronRight,
  AlertCircle, CheckCircle, Sparkles, RefreshCw, Send, ArrowRight
} from 'lucide-react';
import AIAssistantModal from '../components/AIAssistantModal';

const STAGE_META: Record<string, { label: string; cls: string }> = {
  applied:     { label: 'Applied',     cls: 'bg-blue-950/40 text-blue-400 border-blue-800/50' },
  under_review:{ label: 'Under Review',cls: 'bg-indigo-950/40 text-indigo-400 border-indigo-800/50' },
  shortlisted: { label: 'Shortlisted', cls: 'bg-amber-950/40 text-amber-400 border-amber-800/50' },
  assessment:  { label: 'Assessment',  cls: 'bg-purple-950/40 text-purple-400 border-purple-800/50' },
  interview:   { label: 'Interview',   cls: 'bg-violet-950/40 text-violet-400 border-violet-800/50' },
  offer:       { label: 'Offered',     cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' },
  rejected:    { label: 'Rejected',    cls: 'bg-rose-950/40 text-rose-400 border-rose-800/50' },
};

const OFFER_META: Record<string, { label: string; cls: string }> = {
  pending:        { label: 'Pending',        cls: 'bg-slate-800/60 text-slate-400 border-slate-700' },
  selected:       { label: 'Selected',       cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' },
  offer_accepted: { label: 'Offer Accepted', cls: 'bg-green-950/40 text-green-300 border-green-800/50' },
  offer_declined: { label: 'Offer Declined', cls: 'bg-amber-950/40 text-amber-400 border-amber-800/50' },
  rejected:       { label: 'Rejected',       cls: 'bg-rose-950/40 text-rose-400 border-rose-800/50' },
};

function fmtPackage(v: number | null | undefined) {
  if (!v) return '—';
  return `₹${(v / 100000).toFixed(1)} LPA`;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { applications, drives, loading, refreshData, applyToDrive } = usePlacement();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // KPIs computed from live applications
  const kpis = {
    totalApplied: applications.length,
    shortlisted: applications.filter((a: any) =>
      ['shortlisted', 'assessment', 'interview', 'offer'].includes((a.stage || '').toLowerCase())
    ).length,
    offers: applications.filter((a: any) =>
      ['selected', 'offer_accepted', 'offered'].includes((a.offerStatus || '').toLowerCase()) ||
      (a.stage || '').toLowerCase() === 'offer'
    ).length,
  };

  const appliedDriveIds = new Set(applications.map((a: any) => a.driveId));
  const availableDrives = (drives || []).filter((d: any) => !appliedDriveIds.has(d.id));

  const handleApply = async (driveId: string, companyName: string) => {
    try {
      await applyToDrive(driveId);
      showToast(`Successfully applied to ${companyName}!`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to apply to drive', false);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading your placement portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Ambient background glows */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Placement Tracker</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Student Portal</p>
          </div>
        </div>

        {toast && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border shadow-xl ${
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
            title="Refresh records"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{user?.name || user?.fullName || 'Riya Sharma'}</p>
            <p className="text-[10px] text-indigo-400 font-mono">
              {user?.rollNumber || '21CS045'} • {user?.department || 'CSE'} (CGPA: {user?.cgpa || '8.7'})
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-300 border border-slate-700 hover:border-rose-800 px-3 py-1.5 rounded-lg font-bold transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8 relative z-10">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-violet-950/60 border border-indigo-800/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wide">
                Active 2026 Batch
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1.5">
              Welcome back, {user?.name?.split(' ')[0] || 'Riya'}! 👋
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Your applications are live synchronized with the placement cell.
            </p>
          </div>

          <button
            onClick={() => setAssistantOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/60 transition duration-200"
          >
            <Sparkles size={15} className="text-amber-300" />
            <span>Ask AI Assistant</span>
          </button>
        </section>

        {/* KPI Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Applied',
              value: kpis.totalApplied,
              icon: Building2,
              cls: 'text-slate-100',
              sub: 'Across all placement drives',
            },
            {
              label: 'Shortlisted / In Progress',
              value: kpis.shortlisted,
              icon: ChevronRight,
              cls: 'text-amber-400',
              sub: 'Interview & shortlist rounds',
            },
            {
              label: 'Offers Received',
              value: kpis.offers,
              icon: CheckCircle,
              cls: 'text-emerald-400',
              sub: 'Confirmed placement offers',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition duration-300 shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                  <Icon size={16} className="text-slate-600" />
                </div>
                <p className={`text-4xl font-extrabold tracking-tight ${item.cls}`}>{item.value}</p>
                <p className="text-[10px] text-slate-600 mt-1.5 font-medium">{item.sub}</p>
              </div>
            );
          })}
        </section>

        {/* My Applications Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-200">My Applications</h2>
              <p className="text-[11px] text-slate-500">Live recruitment status updated by placement officers.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-950/50 text-indigo-400 border border-indigo-800/50">
              {applications.length} Application{applications.length !== 1 ? 's' : ''}
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-slate-300 font-bold">No applications yet</p>
              <p className="text-slate-500 text-xs mt-1">Explore available placement drives below and apply.</p>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Company</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Drive Date</th>
                      <th className="px-5 py-3.5">Stage</th>
                      <th className="px-5 py-3.5">Offer Status</th>
                      <th className="px-5 py-3.5">Package</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {applications.map((app: any) => {
                      const stageMeta = STAGE_META[(app.stage || '').toLowerCase()] || {
                        label: app.stage || 'Applied',
                        cls: 'bg-slate-800 text-slate-400 border-slate-700',
                      };
                      const offerMeta = OFFER_META[(app.offerStatus || '').toLowerCase()] || {
                        label: app.offerStatus || 'Pending',
                        cls: 'bg-slate-800 text-slate-400 border-slate-700',
                      };

                      const compName = app.company || app.drive?.company?.name || 'Company';
                      const ind = app.industry || app.drive?.company?.industry || 'Technology';
                      const role = app.drive?.roleOffered || app.drive?.roleTitle || 'Graduate Trainee';
                      const dateStr = app.driveDate || app.drive?.driveDate;

                      return (
                        <tr key={app.id || app.applicationId} className="hover:bg-slate-900/40 transition">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-200">{compName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{ind}</div>
                          </td>
                          <td className="px-5 py-4 text-slate-300 font-medium">{role}</td>
                          <td className="px-5 py-4 text-slate-400 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={11} className="text-slate-600" />
                              {dateStr
                                ? new Date(dateStr).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${stageMeta.cls}`}>
                              {stageMeta.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${offerMeta.cls}`}>
                              {offerMeta.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                            {fmtPackage(app.package || app.packageOffered)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Available Drives Section */}
        {availableDrives.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-800/80">
            <div>
              <h2 className="text-base font-extrabold text-slate-200">Upcoming Placement Drives</h2>
              <p className="text-[11px] text-slate-500">Eligible company recruitment drives open for applications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableDrives.map((drive: any) => (
                <div
                  key={drive.id}
                  className="bg-slate-900/50 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-white text-sm">{drive.company?.name}</h3>
                        <p className="text-xs text-indigo-400 font-medium">{drive.roleTitle || drive.roleOffered}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                        {drive.status}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                      <p>
                        Date:{' '}
                        <strong className="text-slate-200">
                          {drive.driveDate ? new Date(drive.driveDate).toLocaleDateString() : 'TBD'}
                        </strong>
                      </p>
                      <p>
                        Min CGPA: <strong className="text-slate-200">{drive.minCgpa || '0.0'}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(drive.id, drive.company?.name || 'Company')}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950"
                  >
                    <span>Apply Now</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating AI Assistant Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="ai-assistant-toggle"
          onClick={() => setAssistantOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl flex items-center justify-center text-white bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-900/60 hover:scale-110 transition duration-200"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={22} />
        </button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-[10px] text-slate-700 font-mono">
        SIH 2026 — Smart India Hackathon | Placement Drive Tracker | Scoped to your authenticated profile
      </footer>
    </div>
  );
}
