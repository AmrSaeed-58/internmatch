import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Users,
  Briefcase,
  ClipboardList,
  CheckCircle,
  XCircle,
  ChevronRight,
  AlertCircle,
  Activity,
  Clock,
  TrendingUp,
  ScrollText,
  X,
  Building2,
  CalendarDays,
  Loader2,
  Shield,
  ShieldCheck,
  Bell,
  Gauge,
  Radar,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import * as adminAPI from '../../api/admin';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function actionLabel(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function actionColor(action) {
  if (action.includes('login'))    return 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20';
  if (action.includes('approved')) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
  if (action.includes('rejected')) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (action.includes('posted'))   return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20';
  if (action.includes('submitted'))return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800';
}

function StatCard({ icon: Icon, label, value, sub, gradient, onClick }) {
  return (
    <button onClick={onClick} className="text-left w-full group block">
      <div className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6 hover:shadow-floating hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-25 transition-opacity duration-300`} />
        <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-4`}>
          <Icon size={24} className="text-white" strokeWidth={2.2} />
        </div>
        <p className="relative text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">{label}</p>
        <p className="relative font-heading font-bold text-3xl text-surface-900 dark:text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="relative text-xs text-surface-400 dark:text-surface-500 mt-1">{sub}</p>
      </div>
    </button>
  );
}

function QuickAction({ to, icon: Icon, label, sub, gradient }) {
  return (
    <Link to={to} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={18} className="text-white" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-surface-900 dark:text-white">{label}</p>
        <p className="text-xs text-surface-500 dark:text-surface-400">{sub}</p>
      </div>
      <ChevronRight size={16} className="text-surface-300 dark:text-surface-600 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
    </Link>
  );
}

function ReviewModal({ internship, onClose, onApprove, onReject }) {
  const [note, setNote] = useState('');
  const [mode, setMode] = useState(null);

  if (!internship) return null;

  function handleConfirm() {
    if (mode === 'approve') onApprove(internship.internshipId, note);
    else onReject(internship.internshipId, note);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 dark:bg-surface-950/70">
      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-floating w-full max-w-lg max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-700 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700 sticky top-0 bg-white dark:bg-surface-800 z-10 rounded-t-2xl">
          <h2 className="font-heading font-semibold text-surface-900 dark:text-white text-lg tracking-tight">Review Internship</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-600 dark:hover:text-surface-300 transition-colors duration-150 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-heading font-semibold text-surface-900 dark:text-white text-xl tracking-tight">{internship.title}</h3>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-surface-500 dark:text-surface-400">
              <Building2 size={14} /><span>{internship.companyName}</span>
              <span className="text-surface-300 dark:text-surface-600">·</span>
              <CalendarDays size={14} /><span>Deadline: {formatDate(internship.deadline)}</span>
            </div>
          </div>

          <div className="bg-surface-50 dark:bg-surface-900/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-surface-500 dark:text-surface-400">Posted</span><span className="font-medium text-surface-700 dark:text-surface-200">{formatDate(internship.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-surface-500 dark:text-surface-400">Status</span><StatusBadge status={internship.status} /></div>
            {internship.location && <div className="flex justify-between"><span className="text-surface-500 dark:text-surface-400">Location</span><span className="font-medium text-surface-700 dark:text-surface-200">{internship.location}</span></div>}
            {internship.workType && <div className="flex justify-between"><span className="text-surface-500 dark:text-surface-400">Work Type</span><span className="font-medium text-surface-700 dark:text-surface-200 capitalize">{internship.workType}</span></div>}
          </div>

          {internship.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-2">Description</p>
              <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed line-clamp-4">{internship.description}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setMode('approve')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors duration-150 cursor-pointer ${mode === 'approve' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>Approve</button>
            <button onClick={() => setMode('reject')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors duration-150 cursor-pointer ${mode === 'reject' ? 'bg-red-600 border-red-600 text-white' : 'border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>Reject</button>
          </div>

          {mode && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-1.5">
                {mode === 'approve' ? 'Approval note (optional)' : 'Rejection reason (optional)'}
              </label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={mode === 'approve' ? 'Add any notes...' : 'Explain why...'} className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 leading-relaxed transition-colors duration-150" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors duration-150 cursor-pointer">Cancel</button>
          <button onClick={handleConfirm} disabled={!mode} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeInternships: 0, pendingReviews: 0, totalApplications: 0 });
  const [pending, setPending] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboardStats();
      const d = res.data.data;
      setStats({ totalUsers: d.totalUsers || 0, activeInternships: d.activeInternships || 0, pendingReviews: d.pendingReviews || 0, totalApplications: d.totalApplications || 0 });
      setPending(d.pendingInternships || []);
      setRecentActivity(d.recentActivity || []);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  async function handleApprove(id) {
    try {
      await adminAPI.approveInternship(id);
      setPending((prev) => prev.filter((p) => p.internshipId !== id));
      setStats((prev) => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
      setReviewTarget(null);
      toast.success('Internship approved.');
    } catch (err) { toast.error('Failed to approve.'); }
  }

  async function handleReject(id, note) {
    try {
      await adminAPI.rejectInternship(id, note);
      setPending((prev) => prev.filter((p) => p.internshipId !== id));
      setStats((prev) => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
      setReviewTarget(null);
      toast.success('Internship rejected.');
    } catch (err) { toast.error('Failed to reject.'); }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-violet-600" /></div>
      </DashboardLayout>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const queueHealth = pending.length === 0 ? 'all clear' : pending.length < 5 ? 'light queue' : pending.length < 15 ? 'moderate queue' : 'heavy queue';

  return (
    <DashboardLayout role="admin">
      {reviewTarget && <ReviewModal internship={reviewTarget} onClose={() => setReviewTarget(null)} onApprove={handleApprove} onReject={handleReject} />}

      {/* Hero — Command Center */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-fuchsia-700 p-8 md:p-10 mb-8 shadow-floating"
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-fuchsia-400/20 blur-3xl translate-y-1/2" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <Shield size={14} className="text-amber-300" />
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">{greeting} · Command Center</span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-2">
              Mission <span className="text-amber-300">Control</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-xl mb-6">
              {pending.length > 0
                ? <>You have <span className="font-bold text-white">{pending.length}</span> internship{pending.length !== 1 ? 's' : ''} awaiting review. Keep the platform running smoothly.</>
                : <>The queue is clear. The platform is running smoothly under your watch.</>}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/internships"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-amber-50 hover:shadow-lg transition-all duration-200"
              >
                <ClipboardList size={16} />
                Review Queue
              </Link>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-bold hover:bg-white/25 transition-all duration-200"
              >
                <Users size={16} />
                Manage Users
              </Link>
            </div>
          </div>

          {/* Floating illustration */}
          <div className="relative w-48 h-48 shrink-0 hidden md:block">
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-40 h-40 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-2xl rotate-6">
                <ShieldCheck size={72} className="text-white -rotate-12" strokeWidth={1.5} />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 -right-2 w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shadow-xl"
            >
              <Bell size={24} className="text-white" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-2 -left-2 w-12 h-12 rounded-2xl bg-fuchsia-400 flex items-center justify-center shadow-xl"
            >
              <Activity size={20} className="text-white" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8"
      >
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub="Across all roles" gradient="from-violet-500 to-indigo-600" onClick={() => navigate('/admin/users')} />
        <StatCard icon={Briefcase} label="Active Internships" value={stats.activeInternships} sub="Live on platform" gradient="from-blue-500 to-indigo-600" onClick={() => navigate('/admin/internships')} />
        <StatCard icon={AlertCircle} label="Pending Reviews" value={pending.length} sub={queueHealth} gradient="from-amber-500 to-orange-600" onClick={() => navigate('/admin/internships')} />
        <StatCard icon={ClipboardList} label="Applications" value={stats.totalApplications} sub="All-time submitted" gradient="from-fuchsia-500 to-pink-600" />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Pending Reviews + Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="xl:col-span-2 flex flex-col gap-6"
        >
          {/* Pending Reviews */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <AlertCircle size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-surface-900 dark:text-white">Pending Reviews</h2>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Internships waiting for approval</p>
                </div>
                {pending.length > 0 && <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{pending.length}</span>}
              </div>
              <button onClick={() => navigate('/admin/internships')} className="text-xs text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                See all <ChevronRight size={13} />
              </button>
            </div>

            {pending.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
                </div>
                <p className="text-base font-bold text-surface-900 dark:text-white mb-1">All caught up</p>
                <p className="text-sm text-surface-500 dark:text-surface-400">No pending reviews — the queue is empty.</p>
              </div>
            ) : (
              <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                {pending.map((item) => (
                  <li key={item.internshipId} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors duration-150">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                      <Briefcase size={18} className="text-white" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">{item.companyName} · {formatDate(item.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setReviewTarget(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150 cursor-pointer">Review</button>
                      <button onClick={() => handleApprove(item.internshipId)} title="Quick approve" className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-150 cursor-pointer"><CheckCircle size={16} /></button>
                      <button onClick={() => handleReject(item.internshipId, '')} title="Quick reject" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-pointer"><XCircle size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
            <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <QuickAction to="/admin/users" icon={Users} label="Manage Users" sub="Suspend, edit, delete" gradient="from-violet-500 to-indigo-600" />
              <QuickAction to="/admin/internships" icon={Briefcase} label="Internship Management" sub="Approve & moderate" gradient="from-blue-500 to-indigo-600" />
              <QuickAction to="/admin/reports" icon={TrendingUp} label="Reports" sub="Generate & export" gradient="from-fuchsia-500 to-pink-600" />
              <QuickAction to="/admin/logs" icon={ScrollText} label="System Logs" sub="Audit & forensics" gradient="from-amber-500 to-orange-600" />
            </div>
          </div>
        </motion.div>

        {/* Right: System Pulse + Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col gap-6"
        >
          {/* System Pulse */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-fuchsia-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-fuchsia-400/30 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Gauge size={20} className="text-white" />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/25 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Live</span>
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg mb-1">System Pulse</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                Platform metrics at a glance.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Active users</span>
                  <span className="font-bold tabular-nums">{stats.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Live listings</span>
                  <span className="font-bold tabular-nums">{stats.activeInternships.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Queue depth</span>
                  <span className={`font-bold tabular-nums ${pending.length > 10 ? 'text-amber-200' : 'text-emerald-200'}`}>{pending.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Applications</span>
                  <span className="font-bold tabular-nums">{stats.totalApplications.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-md">
                  <Radar size={16} className="text-white" />
                </div>
                <h2 className="font-heading font-bold text-base text-surface-900 dark:text-white">Recent Activity</h2>
              </div>
              <button onClick={() => navigate('/admin/logs')} className="text-xs text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                All logs <ChevronRight size={13} />
              </button>
            </div>

            <ul className="divide-y divide-surface-100 dark:divide-surface-800 max-h-[420px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <li className="py-12 text-center">
                  <Activity size={24} className="mx-auto mb-2 text-surface-300 dark:text-surface-600" />
                  <p className="text-sm text-surface-500 dark:text-surface-400">No recent activity.</p>
                </li>
              ) : (
                recentActivity.map((log, idx) => (
                  <li key={log.logId || log.log_id || idx} className="px-6 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors duration-150">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0 ${actionColor(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </div>
                    <p className="text-xs text-surface-600 dark:text-surface-300 mt-1.5 leading-relaxed">
                      {(log.userName || log.full_name) && <span className="font-semibold text-surface-800 dark:text-surface-100">{log.userName || log.full_name}</span>}
                      {(log.userName || log.full_name) ? ' — ' : ''}{log.details}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={10} className="text-surface-300 dark:text-surface-600" />
                      <span className="text-[10px] text-surface-400 dark:text-surface-500">{formatTime(log.createdAt || log.created_at)}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
