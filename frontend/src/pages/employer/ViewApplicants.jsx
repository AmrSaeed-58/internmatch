import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  Download,
  MessageSquare,
  User,
  SortAsc,
  Filter,
  MoreVertical,
  GraduationCap,
  Calendar,
  Star,
  Loader2,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import MatchScoreBadge from '../../components/MatchScoreBadge';
import EmptyState from '../../components/EmptyState';
import * as employerAPI from '../../api/employer';

const STATUS_TRANSITIONS = {
  pending: ['reviewing', 'rejected'],
  reviewing: ['shortlisted', 'rejected'],
  shortlisted: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const SORT_OPTIONS = [
  { value: 'matchScore', label: 'Match Score' },
  { value: 'appliedDate', label: 'Applied Date' },
  { value: 'gpa', label: 'GPA' },
  { value: 'status', label: 'Status' },
];

const STATUS_FILTERS = ['all', 'pending', 'reviewing', 'shortlisted', 'interview_scheduled', 'accepted', 'rejected'];

function GraduationBadge({ status }) {
  const isGraduated = status === 'graduated';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ring-1 ${
      isGraduated
        ? 'bg-accent-50 text-accent-700 ring-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:ring-accent-800/30'
        : 'bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:ring-primary-800/30'
    }`}>
      <GraduationCap size={9} />
      {isGraduated ? 'Graduated' : 'Enrolled'}
    </span>
  );
}

export default function ViewApplicants() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [internshipTitle, setInternshipTitle] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [sortBy, setSortBy] = useState('matchScore');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [internshipRes, applicantsRes] = await Promise.all([
          employerAPI.getInternship(id),
          employerAPI.getApplicants(id, { page, limit: 20, status: statusFilter !== 'all' ? statusFilter : undefined, sortBy }),
        ]);
        setInternshipTitle(internshipRes.data.data.title);
        setApplicants(applicantsRes.data.data || []);
        setPagination(applicantsRes.data.pagination || { total: 0, totalPages: 1 });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load applicants');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, page, statusFilter, sortBy]);

  async function changeStatus(applicationId, newStatus) {
    try {
      await employerAPI.updateApplicationStatus(applicationId, { status: newStatus });
      setApplicants((prev) =>
        prev.map((a) => (a.applicationId === applicationId ? { ...a, status: newStatus } : a))
      );
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
    setOpenDropdown(null);
  }

  async function handleDownloadResume(applicationId) {
    try {
      const res = await employerAPI.downloadResume(applicationId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume-${applicationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download resume');
    }
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
          <div className="relative p-7 md:p-10">
            <Link
              to="/employer/internships"
              className="inline-flex items-center gap-1.5 text-sm text-primary-200/80 hover:text-white font-bold mb-3 cursor-pointer transition-colors duration-150"
            >
              <ArrowLeft size={14} />
              Back to Internships
            </Link>
            <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">Review Candidates</p>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
              Applicants
            </h1>
            <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
              <span className="font-bold text-white">{internshipTitle}</span>
              {' '} · {pagination.total} applicant{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <SortAsc size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="appearance-none pl-8 pr-8 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-700 dark:text-surface-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-8 pr-8 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-700 dark:text-surface-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>

          <p className="text-sm text-surface-500 dark:text-surface-400 ml-auto">
            Showing <span className="font-bold text-surface-700 dark:text-surface-300">{applicants.length}</span> of {pagination.total}
          </p>
        </div>

        {/* Applicants list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : applicants.length === 0 ? (
          <EmptyState
            icon={User}
            title="No applicants yet"
            message={statusFilter !== 'all' ? 'No applicants match the current filter.' : 'Applicants will appear here once students apply to this internship.'}
            actionLabel={statusFilter !== 'all' ? 'Show all' : undefined}
            onAction={statusFilter !== 'all' ? () => setStatusFilter('all') : undefined}
          />
        ) : (
          <div className="space-y-3 stagger-children">
            {applicants.map((applicant) => {
              const transitions = STATUS_TRANSITIONS[applicant.status] || [];
              return (
                <motion.div
                  key={applicant.applicationId}
                  className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card"
                >
                  <div className="relative p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center text-white text-base font-extrabold shrink-0 shadow-lg">
                          {(applicant.fullName || applicant.studentName || '?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                              {applicant.fullName || applicant.studentName}
                            </h3>
                            <GraduationBadge status={applicant.graduationStatus} />
                            <StatusBadge status={applicant.status} />
                          </div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 font-medium">
                            {applicant.major}{applicant.university ? ` · ${applicant.university}` : ''}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-surface-500 dark:text-surface-400">
                            {applicant.gpa && (
                              <span className="inline-flex items-center gap-1 font-bold">
                                <Star size={10} className="text-amber-400" fill="currentColor" />
                                GPA {Number(applicant.gpa).toFixed(2)}
                              </span>
                            )}
                            {applicant.graduationYear && (
                              <span className="inline-flex items-center gap-1">
                                <GraduationCap size={10} />
                                Class of {applicant.graduationYear}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(applicant.appliedAt || applicant.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {applicant.topSkills && applicant.topSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {applicant.topSkills.slice(0, 5).map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-[10px] font-bold border border-surface-200 dark:border-surface-700">
                                  {typeof skill === 'string' ? skill : skill.displayName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:shrink-0">
                        {applicant.matchScore != null && (
                          <MatchScoreBadge score={Math.round(Number(applicant.matchScore))} variant="compact" />
                        )}

                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === applicant.applicationId ? null : applicant.applicationId)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
                          >
                            <MoreVertical size={15} />
                          </button>

                          {openDropdown === applicant.applicationId && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-floating overflow-hidden min-w-[180px]">
                                <Link
                                  to={`/student/profile/${applicant.studentUserId}`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors duration-100 cursor-pointer"
                                >
                                  <User size={13} /> View Profile
                                </Link>
                                <button
                                  onClick={() => { handleDownloadResume(applicant.applicationId); setOpenDropdown(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors duration-100 cursor-pointer text-left"
                                >
                                  <Download size={13} /> Download Resume
                                </button>
                                <Link
                                  to="/employer/messages"
                                  onClick={() => setOpenDropdown(null)}
                                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors duration-100 cursor-pointer"
                                >
                                  <MessageSquare size={13} /> Message Student
                                </Link>
                                {transitions.length > 0 && (
                                  <>
                                    <div className="h-px bg-surface-100 dark:bg-surface-700/60 my-1" />
                                    <div className="px-3 py-1.5">
                                      <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">Change Status</p>
                                      {transitions.map((status) => (
                                        <button
                                          key={status}
                                          onClick={() => changeStatus(applicant.applicationId, status)}
                                          className="w-full text-left px-2 py-1.5 text-xs text-surface-700 dark:text-surface-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 rounded-lg transition-colors duration-100 cursor-pointer capitalize"
                                        >
                                          {status.replace(/_/g, ' ')}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="group relative rounded-xl overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-400/10 via-transparent to-accent-400/6" />
              <span className="relative block px-3.5 py-2 text-surface-600 dark:text-surface-400 text-sm font-bold hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
                Previous
              </span>
            </button>
            <span className="text-sm text-surface-500 dark:text-surface-400 px-2 font-bold">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="group relative rounded-xl overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-400/10 via-transparent to-accent-400/6" />
              <span className="relative block px-3.5 py-2 text-surface-600 dark:text-surface-400 text-sm font-bold hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
                Next
              </span>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
