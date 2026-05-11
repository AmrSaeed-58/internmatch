import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Calendar, Loader2, Mail, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import MatchScoreBadge from '../../components/MatchScoreBadge';
import EmptyState from '../../components/EmptyState';
import * as adminAPI from '../../api/admin';

const STATUS_OPTIONS = ['all', 'pending', 'under_review', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn'];

export default function InternshipApplicants() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState([]);
  const [internship, setInternship] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminAPI.getInternshipApplicants(id, {
      page,
      limit: 25,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setApplicants(res.data.data?.applicants || []);
        setInternship(res.data.data?.internship || null);
        setPagination(res.data.pagination || { total: 0, totalPages: 1 });
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.response?.data?.message || 'Failed to load applicants');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, page, statusFilter]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/internships"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to internships
          </Link>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
          <h1 className="font-heading text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            Applicants for {internship?.title || '...'}
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {internship?.companyName || ''}
            {internship?.status ? <span className="ml-2"><StatusBadge status={internship.status} /></span> : null}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors duration-150 cursor-pointer ${
                statusFilter === s
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-surface-500">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : applicants.length === 0 ? (
          <EmptyState
            title="No applicants"
            description="No one has applied to this internship yet."
          />
        ) : (
          <div className="space-y-3">
            {applicants.map((a) => (
              <div key={a.applicationId} className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-bold text-surface-900 dark:text-white">{a.fullName}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 flex items-center gap-1.5">
                      <Mail size={11} /> {a.email}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5">
                      {a.major}{a.university ? ` · ${a.university}` : ''}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-500 dark:text-surface-400">
                      {a.gpa && (
                        <span className="inline-flex items-center gap-1 font-bold">
                          <Star size={10} className="text-amber-400" fill="currentColor" />
                          GPA {Number(a.gpa).toFixed(2)}
                        </span>
                      )}
                      {a.graduationYear && (
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap size={10} />
                          Class of {a.graduationYear}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={10} />
                        Applied {new Date(a.appliedDate).toLocaleDateString()}
                      </span>
                      {a.interviewDate && (
                        <span className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold">
                          <Calendar size={10} />
                          Interview {new Date(a.interviewDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.matchScore != null && (
                      <MatchScoreBadge score={Math.round(Number(a.matchScore))} variant="compact" />
                    )}
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-bold text-surface-600 dark:text-surface-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm text-surface-500 dark:text-surface-400 px-2 font-bold">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 text-sm font-bold text-surface-600 dark:text-surface-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
