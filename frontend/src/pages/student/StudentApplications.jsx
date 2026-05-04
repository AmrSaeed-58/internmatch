import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  Trash2,
  Calendar,
  TrendingUp,
  Filter,
  Briefcase,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import MatchScoreBadge from '../../components/MatchScoreBadge';
import EmptyState from '../../components/EmptyState';
import * as studentAPI from '../../api/student';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } };

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'score_high', label: 'Highest Score' },
  { value: 'score_low', label: 'Lowest Score' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ConfirmWithdrawModal({ app, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 dark:bg-surface-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden max-w-sm w-full"
      >
        <div className="relative p-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm mb-4">
            <Trash2 size={20} className="text-white" />
          </div>
          <h3 className="font-heading font-extrabold text-surface-900 dark:text-white text-lg tracking-tight mb-2">
            Withdraw Application?
          </h3>
          <p className="text-surface-500 dark:text-surface-400 text-sm mb-5 leading-relaxed">
            Are you sure you want to withdraw your application for{' '}
            <span className="font-semibold text-surface-700 dark:text-surface-300">{app.internshipTitle}</span> at{' '}
            <span className="font-semibold text-surface-700 dark:text-surface-300">{app.companyName}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-semibold transition-colors duration-200 cursor-pointer shadow-lg"
            >
              Withdraw
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const STAT_CONFIGS = [
  { label: 'Total', key: 'total', icon: FileText, color: 'from-primary-500 to-primary-700', accent: 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300' },
  { label: 'Active', key: 'active', icon: Clock, color: 'from-amber-500 to-amber-600', accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300' },
  { label: 'Interviews', key: 'interviews', icon: Briefcase, color: 'from-violet-500 to-violet-700', accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300' },
  { label: 'Accepted', key: 'accepted', icon: CheckCircle, color: 'from-accent-500 to-accent-700', accent: 'bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-300' },
];

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50, sort: sortBy };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await studentAPI.getApplications(params);
      const mapped = res.data.data.map((a) => ({
        applicationId: a.applicationId,
        internshipId: a.internshipId,
        internshipTitle: a.internship?.title,
        companyName: a.employer?.companyName,
        companyLogo: a.employer?.companyLogo,
        industry: a.employer?.industry,
        location: a.internship?.location,
        workType: a.internship?.workType,
        status: a.status,
        matchScore: a.matchScore,
        appliedDate: a.appliedDate,
        statusUpdatedAt: a.statusUpdatedAt,
        coverLetter: a.coverLetter,
        employerNote: a.employerNote,
      }));
      setApplications(mapped);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filtered = applications;

  async function confirmWithdraw() {
    try {
      await studentAPI.withdrawApplication(withdrawTarget.applicationId);
      setApplications((prev) =>
        prev.map((a) =>
          a.applicationId === withdrawTarget.applicationId ? { ...a, status: 'withdrawn' } : a
        )
      );
      toast.success(`Application withdrawn for ${withdrawTarget.internshipTitle}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application');
    }
    setWithdrawTarget(null);
  }

  const stats = {
    total: applications.length,
    active: applications.filter((a) => !['rejected', 'withdrawn'].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === 'interview_scheduled').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
  };

  return (
    <DashboardLayout role="student">
      {withdrawTarget && (
        <ConfirmWithdrawModal
          app={withdrawTarget}
          onConfirm={confirmWithdraw}
          onCancel={() => setWithdrawTarget(null)}
        />
      )}

      {/* Rich Banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
        className="mb-8 relative rounded-xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-400/10 via-transparent to-transparent" />

        <div className="relative p-7 md:p-10">
          <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">Track Progress</p>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
            My Applications
          </h1>
          <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
            Track and manage all your internship applications in one place.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
        {STAT_CONFIGS.map(({ label, key, icon: Icon, color, accent }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            
            
            className="group bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 hover:shadow-card-hover transition-shadow duration-200"
          >
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                  <Icon size={20} className="text-white" strokeWidth={2.2} />
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${accent}`}>
                  {label}
                </div>
              </div>
              <p className="font-heading font-bold text-2xl text-surface-900 dark:text-white tracking-tight leading-none mb-1">
                {stats[key]}
              </p>
              <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 22 }}
        className="relative rounded-xl overflow-hidden mb-6"
      >
        <div className="relative p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-500 flex items-center justify-center shadow-sm">
              <Filter size={15} className="text-white" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Applications list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications found"
          message={statusFilter !== 'all' ? 'No applications match this status filter.' : 'You haven\'t applied to any internships yet.'}
          actionLabel={statusFilter !== 'all' ? 'Clear filter' : 'Browse Internships'}
          onAction={statusFilter !== 'all' ? () => setStatusFilter('all') : undefined}
          actionTo={statusFilter === 'all' ? '/student/internships' : undefined}
        />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
          {filtered.map((app) => {
            const gradients = [
              'from-primary-400 to-primary-600',
              'from-accent-400 to-accent-600',
              'from-violet-400 to-violet-600',
              'from-amber-400 to-amber-600',
              'from-rose-400 to-rose-600',
            ];
            const idx = (app.companyName || '').charCodeAt(0) % gradients.length;

            return (
              <motion.div
                key={app.applicationId}
                variants={fadeUp}
                
                
                className="group bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 hover:shadow-card-hover transition-shadow duration-200"
              >

                <div className="relative p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Company avatar */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[idx]} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-lg`}>
                    {(app.companyName || '?').charAt(0)}
                  </div>

                  {/* Title + company */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-surface-900 dark:text-white text-base leading-tight truncate tracking-tight">
                      {app.internshipTitle}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 font-medium">{app.companyName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-400 dark:text-surface-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Applied {formatDate(app.appliedDate)}
                      </span>
                      {app.statusUpdatedAt && new Date(app.statusUpdatedAt).getTime() !== new Date(app.appliedDate).getTime() && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={11} />
                          Updated {formatDate(app.statusUpdatedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match score */}
                  <div className="shrink-0">
                    <MatchScoreBadge score={app.matchScore} variant="compact" />
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <StatusBadge status={app.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/internship/${app.internshipId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <ExternalLink size={12} />
                      View
                    </Link>
                    {!['withdrawn', 'rejected', 'accepted'].includes(app.status) && (
                      <button
                        onClick={() => setWithdrawTarget(app)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 size={12} />
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
