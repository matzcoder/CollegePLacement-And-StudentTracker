import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  GraduationCap, MessageCircle, X, Send,
  Building2, Calendar, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';

interface KPIs { totalApplied: number; offers: number; shortlisted: number; }
interface Application {
  id: string;
  stage: string;
  offerStatus: string;
  package: number | null;
  appliedOn: string;
  drive: {
    company: { name: string; industry: string };
    roleOffered: string | null;
    driveDate: string;
  };
}

const STAGE_META: Record<string, { label: string; cls: string }> = {
  applied:     { label: 'Applied',     cls: 'bg-blue-950/40 text-blue-400 border-blue-800/50' },
  shortlisted: { label: 'Shortlisted', cls: 'bg-amber-950/40 text-amber-400 border-amber-800/50' },
  interview:   { label: 'Interview',   cls: 'bg-violet-950/40 text-violet-400 border-violet-800/50' },
  offer:       { label: 'Offer',       cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' },
  rejected:    { label: 'Rejected',    cls: 'bg-rose-950/40 text-rose-400 border-rose-800/50' },
};

const OFFER_META: Record<string, { label: string; cls: string }> = {
  pending:        { label: 'Pending',        cls: 'bg-slate-800/60 text-slate-400 border-slate-700' },
  selected:       { label: 'Selected',       cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' },
  offer_accepted: { label: 'Offer Accepted', cls: 'bg-green-950/40 text-green-300 border-green-800/50' },
  offer_declined: { label: 'Offer Declined', cls: 'bg-amber-950/40 text-amber-400 border-amber-800/50' },
  rejected:       { label: 'Rejected',       cls: 'bg-rose-950/40 text-rose-400 border-rose-800/50' },
};

function fmt(v: number | null) {
  if (!v) return '—';
  return `₹${(v / 100000).toFixed(1)}L`;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [kpis, setKpis] = useState<KPIs>({ totalApplied: 0, offers: 0, shortlisted: 0 });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; text: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const flash = (msg: string, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 4000);
  };

  async function fetchDashboard() {
    try {
      const { data } = await api.get('/dashboard/student');
      setKpis(data.kpis);
      setApplications(data.applications);
    } catch {
      flash('Failed to load dashboard data', false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatBusy) return;
    const userMsg = chatInput.trim();
    setChatMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatBusy(true);
    try {
      const { data } = await api.post('/assistant/query', { message: userMsg });
      setChatMessages((m) => [...m, { role: 'assistant', text: data.response }]);
    } catch {
      setChatMessages((m) => [...m, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatBusy(false);
    }
  }

  if (loading) {
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
      {/* Ambient effects */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/70 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">Placement Tracker</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Student Portal</p>
          </div>
        </div>

        {/* Notification toast */}
        {notification && (
          <div className={`absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border shadow-lg ${
            notification.ok
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-700/50'
          }`}>
            {notification.ok
              ? <CheckCircle size={14} className="text-emerald-400" />
              : <AlertCircle size={14} className="text-rose-400" />
            }
            {notification.msg}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">
              {user?.name || 'Student'}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs bg-slate-800 hover:bg-rose-900/40 hover:text-rose-200 text-slate-300 border border-slate-700 hover:border-rose-700/50 px-3 py-1.5 rounded-lg font-bold transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8 relative z-10">

        {/* KPI Cards */}
        <section aria-label="Your placement summary">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Applied',
                value: kpis.totalApplied,
                icon: Building2,
                cls: 'text-slate-100',
                sub: 'Across all companies',
              },
              {
                label: 'Shortlisted / In Progress',
                value: kpis.shortlisted,
                icon: ChevronRight,
                cls: 'text-amber-400',
                sub: 'Interview or shortlist stage',
              },
              {
                label: 'Offers Received',
                value: kpis.offers,
                icon: CheckCircle,
                cls: 'text-emerald-400',
                sub: 'Accepted or selected',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300"
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
          </div>
        </section>

        {/* Applications Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-200">My Applications</h2>
              <p className="text-[11px] text-slate-500">Track your recruitment pipeline across all drives.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/40 text-indigo-400 border border-indigo-800/40">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-slate-400 font-semibold">No applications yet</p>
              <p className="text-slate-600 text-sm mt-1">Contact your placement officer to apply to upcoming drives.</p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 text-left">Company</th>
                      <th className="px-5 py-3.5 text-left">Role</th>
                      <th className="px-5 py-3.5 text-left">Drive Date</th>
                      <th className="px-5 py-3.5 text-left">Stage</th>
                      <th className="px-5 py-3.5 text-left">Status</th>
                      <th className="px-5 py-3.5 text-left">Package</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {applications.map((app) => {
                      const stageMeta = STAGE_META[app.stage] || { label: app.stage, cls: 'bg-slate-800 text-slate-400 border-slate-700' };
                      const offerMeta = OFFER_META[app.offerStatus] || { label: app.offerStatus, cls: 'bg-slate-800 text-slate-400 border-slate-700' };

                      return (
                        <tr key={app.id} className="hover:bg-slate-900/30 transition duration-150">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-200">{app.drive.company.name}</div>
                            <div className="text-[9px] text-slate-500 font-medium mt-0.5">{app.drive.company.industry}</div>
                          </td>
                          <td className="px-5 py-4 text-slate-400">{app.drive.roleOffered || '—'}</td>
                          <td className="px-5 py-4 text-slate-500 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={10} className="text-slate-600" />
                              {new Date(app.drive.driveDate).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border ${stageMeta.cls}`}>
                              {stageMeta.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border ${offerMeta.cls}`}>
                              {offerMeta.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-400 font-mono">
                            {fmt(app.package)}
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

      </main>

      {/* AI Assistant Floating Chat */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-80 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-indigo-800 to-violet-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 bg-white/10 rounded-lg flex items-center justify-center">
                  <MessageCircle size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xs">AI Assistant</p>
                  <p className="text-indigo-200 text-[9px]">Placement Q&A • Scoped to your data</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/60 hover:text-white transition"
                aria-label="Close assistant"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              className="h-64 overflow-y-auto p-3 space-y-2.5 bg-slate-950/50"
              role="log"
              aria-live="polite"
            >
              {chatMessages.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <p className="text-slate-500 text-xs font-medium">Ask about your placement journey</p>
                  {['Where did I apply?', 'Did I get an offer?', 'What is my package?'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setChatInput(s); }}
                      className="block w-full text-left text-[10px] text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/30 px-3 py-1.5 rounded-lg transition"
                    >
                      💬 {s}
                    </button>
                  ))}
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatBusy && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl rounded-bl-sm text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={sendChat} className="border-t border-slate-800 flex bg-slate-900">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2.5 text-xs bg-transparent focus:outline-none text-slate-200 placeholder-slate-600"
                aria-label="Chat input"
                disabled={chatBusy}
              />
              <button
                type="submit"
                disabled={chatBusy || !chatInput.trim()}
                className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition flex items-center"
                aria-label="Send"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          id="ai-assistant-toggle"
          onClick={() => setChatOpen(!chatOpen)}
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 ${
            chatOpen
              ? 'bg-slate-700 shadow-slate-900/50'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-900/60 hover:scale-110'
          }`}
          aria-label="Toggle AI Assistant"
        >
          {chatOpen ? <X size={20} /> : <MessageCircle size={22} />}
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-3 text-center text-[10px] text-slate-700 font-mono">
        SIH 2026 — Smart India Hackathon | Placement Drive Tracker | All data scoped to your profile
      </footer>
    </div>
  );
}
