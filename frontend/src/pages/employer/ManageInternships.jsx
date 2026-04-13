import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Lock,
  RefreshCw,
  ChevronDown,
  Calendar,
  Users,
  TrendingUp,
  Search,
  Loader2,
  Briefcase,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import * as employerAPI from '../../api/employer';

const STATUS_FILTERS = ['all', 'active', 'pending_approval', 'closed', 'rejected'];

export default function ManageInternships() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInternships() {
      try {
        const res = await employerAPI.getInternships({ limit: 50 });
        setItems(res.data.data);
      } catch (err) {
        toast.error('Failed to load internships');
      } finally {
        setLoading(false);
      }
    }
    fetchInternships();
  }, []);

  const filtered = items.filter((i) => {
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  async function handleDelete(id) {
    try {
      await employerAPI.deleteInternship(id);
      setItems((prev) => prev.filter((i) => i.internshipId !== id));
      toast.success('Internship deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
    setDeleteTarget(null);
  }

  async function handleClose(id) {
    try {
      await employerAPI.closeInternship(id);
      setItems((prev) => prev.map((i) => i.internshipId === id ? { ...i, status: 'closed' } : i));
      toast.success('Internship closed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close');
    }
  }

  async function handleResubmit(id) {
    try {
      await employerAPI.resubmitInternship(id);
      setItems((prev) => prev.map((i) => i.internshipId === id ? { ...i, status: 'pending_approval', adminReviewNote: null } : i));
      toast.success('Internship resubmitted for review');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resubmit');
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="employer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employer">
      <div className="space-y-6">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
          className="mb-8 relative rounded-xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
          <div className="absolute -bottom-16 right-1/4 w-48 h-48 rounded-full bg-accent-400/10 blur-2xl" />
          <div className="relative p-7 md:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">Employer Portal</p>
              <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                Manage Internships
              </h1>
              <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
                {items.length} total postings · {items.filter((i) => i.status === 'active').length} active
              </p>
            </div>
            <Link
              to="/employer/internships/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-bold hover:bg-primary-50 active:bg-primary-100 transition-colors duration-150 cursor-pointer shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0"
            >
              <Plus size={16} />
              Post New
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150"
              placeholder="Search internships..."
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-700 dark:text-surface-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
          <div className="relative">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-800/50">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Posted</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Deadline</th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Applicants</th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Views</th>
                    <th className="text-right px-5 py-3.5 text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700/40">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-sm text-surface-400 dark:text-surface-500">
                        No internships found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((internship) => (
                      <motion.tr
                        key={internship.internshipId}
                        whileHover={{ backgroundColor: 'rgba(var(--color-primary-50), 0.5)' }}
                        className="transition-colors duration-100"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-surface-900 dark:text-white">{internship.title}</p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 capitalize">
                            {internship.workType?.replace('-', ' ')} · {internship.location}
                          </p>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={internship.status} /></td>
                        <td className="px-4 py-4 text-sm text-surface-600 dark:text-surface-400">
                          {new Date(internship.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-surface-600 dark:text-surface-400">
                          {internship.deadline ? new Date(internship.deadline).toLocaleDateString() : '\u2014'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-surface-700 dark:text-surface-300">
                            <Users size={13} className="text-primary-500" />
                            {internship.applicantCount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-surface-700 dark:text-surface-300">
                            <TrendingUp size={13} className="text-accent-500" />
                            {internship.viewCount}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/employer/internship/${internship.internshipId}/applicants`}
                              title="View Applicants"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors duration-150 cursor-pointer"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              to={`/employer/internship/${internship.internshipId}/edit`}
                              title="Edit"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors duration-150 cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </Link>
                            {internship.status === 'active' && (
                              <button
                                onClick={() => handleClose(internship.internshipId)}
                                title="Close"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-colors duration-150 cursor-pointer"
                              >
                                <Lock size={14} />
                              </button>
                            )}
                            {internship.status === 'rejected' && (
                              <button
                                onClick={() => handleResubmit(internship.internshipId)}
                                title="Resubmit"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 dark:hover:text-accent-400 transition-colors duration-150 cursor-pointer"
                              >
                                <RefreshCw size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(internship.internshipId)}
                              title="Delete"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-surface-100 dark:divide-surface-700/40">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-surface-400">No internships found</div>
              ) : (
                filtered.map((internship) => (
                  <motion.div
                    key={internship.internshipId}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">{internship.title}</p>
                        <p className="text-xs text-surface-400 mt-0.5 capitalize">
                          {internship.workType?.replace('-', ' ')} · {internship.location}
                        </p>
                      </div>
                      <StatusBadge status={internship.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
                      <span className="flex items-center gap-1"><Calendar size={11} />{internship.deadline ? new Date(internship.deadline).toLocaleDateString() : '\u2014'}</span>
                      <span className="flex items-center gap-1"><Users size={11} className="text-primary-500" />{internship.applicantCount}</span>
                      <span className="flex items-center gap-1"><Eye size={11} className="text-accent-500" />{internship.viewCount}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/employer/internship/${internship.internshipId}/applicants`}
                        className="flex-1 text-center py-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-bold">
                        View
                      </Link>
                      <Link to={`/employer/internship/${internship.internshipId}/edit`}
                        className="flex-1 text-center py-1.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-xs font-bold">
                        Edit
                      </Link>
                      <button onClick={() => setDeleteTarget(internship.internshipId)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold">
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative rounded-xl overflow-hidden max-w-md w-full animate-scale-in bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-floating">
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                  <Trash2 size={20} className="text-white" />
                </div>
                <h3 className="font-heading text-lg font-bold text-surface-900 dark:text-white tracking-tight">Delete Internship?</h3>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed mb-6">
                This will permanently delete the internship and all associated applications. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-bold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteTarget)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 transition-colors duration-150 cursor-pointer shadow-lg">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
