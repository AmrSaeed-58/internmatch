import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ScrollText,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Shield,
  GraduationCap,
  Briefcase,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import * as adminAPI from '../../api/admin';

const PAGE_SIZE = 50;

const ACTION_TYPES = [
  'all',
  'user_login',
  'internship_posted',
  'internship_approved',
  'internship_rejected',
  'application_submitted',
  'deadline_cleanup',
  'user_deactivated',
  'user_deleted',
  'password_changed',
];

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function actionLabel(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function actionColorClasses(action) {
  if (action.includes('login'))      return 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 ring-primary-200 dark:ring-primary-800/40';
  if (action.includes('approved'))   return 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 ring-accent-200 dark:ring-accent-800/40';
  if (action.includes('rejected') || action.includes('deleted') || action.includes('deactivated'))
                                     return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-800/40';
  if (action.includes('posted') || action.includes('submitted'))
                                     return 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-violet-200 dark:ring-violet-800/40';
  if (action.includes('cleanup'))    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/40';
  return 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 ring-surface-200 dark:ring-surface-700';
}

function roleIcon(role) {
  switch (role) {
    case 'admin':    return <Shield size={12} />;
    case 'student':  return <GraduationCap size={12} />;
    case 'employer': return <Briefcase size={12} />;
    default:         return <Monitor size={12} />;
  }
}

function roleClasses(role) {
  switch (role) {
    case 'admin':    return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
    case 'student':  return 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400';
    case 'employer': return 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400';
    default:         return 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400';
  }
}

function mapLog(l) {
  return {
    logId: l.log_id,
    action: l.action,
    details: l.details,
    ipAddress: l.ip_address,
    createdAt: l.created_at,
    userName: l.full_name,
    role: l.role,
    userId: l.user_id,
  };
}

export default function SystemLogs() {
  const [logs, setLogs]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [actionFilter, setAction]     = useState('all');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [page, setPage]               = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (actionFilter !== 'all') params.action = actionFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const res = await adminAPI.getLogs(params);
      const { data, pagination } = res.data;
      setLogs((data || []).map(mapLog));
      setTotal(pagination?.total || 0);
      setTotalPages(pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load system logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleExport() {
    try {
      const params = {};
      if (search) params.search = search;
      if (actionFilter !== 'all') params.action = actionFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const res = await adminAPI.exportLogs(params);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export logs.');
    }
  }

  const currentPage = Math.min(page, totalPages);

  return (
    <DashboardLayout role="admin">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
        className="mb-8 relative rounded-xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
        <div className="absolute -bottom-16 right-1/4 w-48 h-48 rounded-full bg-accent-400/10 blur-2xl" />
        <div className="relative p-7 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">AUDIT TRAIL</p>
              <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">System Logs</h1>
              <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">Full audit trail of all platform activity.</p>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white text-sm font-bold backdrop-blur-sm border border-white/20 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 shrink-0"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="group relative rounded-xl overflow-hidden mb-6 bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
        <div className="relative p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by user name..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150"
            />
          </div>

          {/* Action type */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <select
              value={actionFilter}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none cursor-pointer transition-colors duration-150"
            >
              {ACTION_TYPES.map((a) => (
                <option key={a} value={a}>{a === 'all' ? 'All Actions' : actionLabel(a)}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
            />
          </div>

          {/* Date to */}
          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Result count badge */}
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-3 px-1 font-bold">
        {total} log{total !== 1 ? 's' : ''} found
      </p>

      {/* Table */}
      <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
        <div className="relative">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-surface-100 dark:border-surface-700">
            <div className="w-9 h-9 rounded-xl bg-accent-600 flex items-center justify-center shadow-sm">
              <ScrollText size={16} className="text-white" />
            </div>
            <h2 className="font-heading font-bold text-surface-900 dark:text-white tracking-tight">Activity Log</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-primary-500" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState icon={ScrollText} title="No logs found" message="Try adjusting your filters or date range." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30">
                      {['Timestamp', 'User', 'Action', 'IP Address', 'Details'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700/30">
                    {logs.map((log) => (
                      <tr key={log.logId} className="hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors duration-100">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500 font-medium">
                            <Clock size={11} className="shrink-0" />
                            {formatTimestamp(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-surface-800 dark:text-surface-100">
                              {log.userName || 'System'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold w-fit ${roleClasses(log.role)}`}>
                              {roleIcon(log.role)}
                              {log.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ring-1 uppercase whitespace-nowrap ${actionColorClasses(log.action)}`}>
                            {actionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
                          {log.ipAddress || '--'}
                        </td>
                        <td className="px-5 py-3.5 text-surface-600 dark:text-surface-300 max-w-[240px] truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-surface-100 dark:border-surface-700">
                <p className="text-xs text-surface-400 dark:text-surface-500 font-medium">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1}--{Math.min(currentPage * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-1.5">
                  <NavBtn icon={ChevronLeft}  disabled={currentPage === 1}          onClick={() => setPage((p) => p - 1)} />
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        pg === currentPage
                          ? 'bg-primary-600 text-white shadow-glow-sm'
                          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <NavBtn icon={ChevronRight} disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function NavBtn({ icon: Icon, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Icon size={15} />
    </button>
  );
}
