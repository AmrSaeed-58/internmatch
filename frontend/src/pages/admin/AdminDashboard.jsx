import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  if (action.includes('approved')) return 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20';
  if (action.includes('rejected')) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (action.includes('posted'))   return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20';
  if (action.includes('submitted'))return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800';
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} className="text-left w-full group block">
      <div className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 p-5 hover:shadow-card-hover transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
            <Icon size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium text-surface-500 dark:text-surface-400">{label}</span>
        </div>
        <p className="font-heading font-bold text-2xl text-surface-900 dark:text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </button>
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
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-floating w-full max-w-lg max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-700 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700 sticky top-0 bg-white dark:bg-surface-800 z-10 rounded-t-xl">
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

          <div className="bg-surface-50 dark:bg-surface-900/50 rounded-lg p-4 space-y-2 text-sm">
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
            <button onClick={() => setMode('approve')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors duration-150 cursor-pointer ${mode === 'approve' ? 'bg-accent-600 border-accent-600 text-white' : 'border-accent-200 dark:border-accent-800/50 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20'}`}>Approve</button>
            <button onClick={() => setMode('reject')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors duration-150 cursor-pointer ${mode === 'reject' ? 'bg-red-600 border-red-600 text-white' : 'border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>Reject</button>
          </div>

          {mode && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-1.5">
                {mode === 'approve' ? 'Approval note (optional)' : 'Rejection reason (optional)'}
              </label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={mode === 'approve' ? 'Add any notes...' : 'Explain why...'} className="w-full px-3.5 py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 leading-relaxed transition-colors duration-150" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors duration-150 cursor-pointer">Cancel</button>
          <button onClick={handleConfirm} disabled={!mode} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer">Confirm</button>
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

  async function handleApprove(id, note) {
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
        <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-primary-600" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      {reviewTarget && <ReviewModal internship={reviewTarget} onClose={() => setReviewTarget(null)} onApprove={handleApprove} onReject={handleReject} />}

      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-surface-400" />
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">Control Center</p>
            </div>
            <h1 className="font-heading font-bold text-2xl text-surface-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-primary-600" onClick={() => navigate('/admin/users')} />
        <StatCard icon={Briefcase} label="Active Internships" value={stats.activeInternships} color="bg-primary-800" onClick={() => navigate('/admin/internships')} />
        <StatCard icon={AlertCircle} label="Pending Reviews" value={pending.length} color="bg-accent-600" onClick={() => navigate('/admin/internships')} />
        <StatCard icon={ClipboardList} label="Applications" value={stats.totalApplications} color="bg-cta-500" />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Pending + Quick Actions */}
        <div className="xl:col-span-2 space-y-5">
          {/* Pending Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-heading font-semibold text-surface-900 dark:text-white text-sm">Pending Reviews</h2>
                  {pending.length > 0 && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400">{pending.length}</span>}
                </div>
                <button onClick={() => navigate('/admin/internships')} className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                  See all <ChevronRight size={13} />
                </button>
              </div>

              {pending.length === 0 ? (
                <div className="py-10 text-center text-surface-400 dark:text-surface-500 text-sm">
                  <CheckCircle size={24} className="mx-auto mb-2 text-primary-400" />
                  All caught up — no pending reviews.
                </div>
              ) : (
                <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                  {pending.map((item) => (
                    <li key={item.internshipId} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150">
                      <div className="w-9 h-9 rounded-lg bg-primary-800 flex items-center justify-center shrink-0">
                        <Briefcase size={15} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-surface-800 dark:text-surface-100 truncate">{item.title}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{item.companyName} · {formatDate(item.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setReviewTarget(item)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150 cursor-pointer">Review</button>
                        <button onClick={() => handleApprove(item.internshipId, '')} title="Quick approve" className="w-7 h-7 flex items-center justify-center rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-150 cursor-pointer"><CheckCircle size={15} /></button>
                        <button onClick={() => handleReject(item.internshipId, '')} title="Quick reject" className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-pointer"><XCircle size={15} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="font-heading font-semibold text-surface-900 dark:text-white text-sm mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Manage Users', icon: Users, path: '/admin/users', color: 'bg-primary-600' },
                { label: 'Review Internships', icon: Briefcase, path: '/admin/internships', color: 'bg-primary-800' },
                { label: 'View Reports', icon: TrendingUp, path: '/admin/reports', color: 'bg-accent-600' },
                { label: 'View Logs', icon: ScrollText, path: '/admin/logs', color: 'bg-cta-500' },
              ].map(({ label, icon: Icon, path, color }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-800 hover:shadow-card-hover transition-shadow duration-200 cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-surface-700 dark:text-surface-200 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800">
              <h2 className="font-heading font-semibold text-surface-900 dark:text-white text-sm">Recent Activity</h2>
              <button onClick={() => navigate('/admin/logs')} className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                All logs <ChevronRight size={13} />
              </button>
            </div>

            <ul className="divide-y divide-surface-100 dark:divide-surface-800 flex-1 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <li className="py-10 text-center text-surface-400 dark:text-surface-500 text-sm">
                  <Activity size={20} className="mx-auto mb-2 text-surface-300 dark:text-surface-600" />
                  No recent activity.
                </li>
              ) : (
                recentActivity.map((log, idx) => (
                  <li key={log.logId || log.log_id || idx} className="px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0 ${actionColor(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
                      {(log.userName || log.full_name) && <span className="font-medium text-surface-700 dark:text-surface-200">{log.userName || log.full_name}</span>}
                      {' — '}{log.details}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
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
