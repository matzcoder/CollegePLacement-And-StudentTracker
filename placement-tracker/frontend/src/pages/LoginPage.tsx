import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail, GraduationCap } from 'lucide-react';

const DEMO_USERS = [
  { role: 'Admin', email: 'admin@college.edu', password: 'Admin@1234' },
  { role: 'Officer', email: 'officer@college.edu', password: 'Officer@1234' },
  { role: 'Student', email: 'riya.sharma@college.edu', password: 'Student@1234' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const axiosErr = err as any;
      const msg =
        axiosErr?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-2xl shadow-indigo-500/30 mb-2">
            <GraduationCap size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Placement Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              SIH 2026 — College Placement Management System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all duration-200"
                  placeholder="you@college.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all duration-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs rounded-xl px-4 py-3 flex items-start gap-2.5"
              >
                <AlertCircle size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              aria-busy={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-300 text-sm shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Portal'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800/60">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-3">
              Quick Access — Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => fillDemo(d.email, d.password)}
                  id={`demo-${d.role.toLowerCase()}`}
                  className="bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-600/40 text-slate-400 hover:text-indigo-300 rounded-xl px-2 py-2.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 text-center"
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security badge */}
        <p className="text-center text-[10px] text-slate-600 font-mono">
          🔒 Secured with JWT · bcrypt · RBAC · Rate Limiting
        </p>
      </div>
    </div>
  );
}
