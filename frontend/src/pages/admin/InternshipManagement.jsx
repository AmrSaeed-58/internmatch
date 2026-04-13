import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Briefcase,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building2,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import * as adminAPI from '../../api/admin';

// ── constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapInternship(i) {
  return {
    internshipId: i.internship_id,
    title: i.title,
    status: i.status,
    createdAt: i.created_at,
    deadline: i.deadline,
    adminReviewNote: i.admin_review_note,
    companyName: i.company_name,
    companyContact: i.companyContact,
    applicantCount: i.applicantCount,
    description: i.description,
    location: i.location,
    workType: i.workType || i.work_type,
  };
}

// ── modals ────────────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 dark:bg-surface-950/70 backdrop-blur-sm">
      <div className="relative rounded-xl shadow-floating w-full max-w-lg flex flex-col max-h-[90vh] animate-scale-in overflow-hidden bg-white dark:bg-dark-card">
        <div className="relative flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700 shrink-0">
            <h2 className="font-heading font-bold text-surface-900 dark:text-white text-lg tracking-tight">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <X size={16} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex gap-3 shrink-0">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewModal({ internship, onClose }) {
  if (!internship) return null;
  return (
    <ModalShell title="Internship Details" onClose={onClose} footer={
      <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400">Close</button>
    }>
      <div className="space-y-4">
        <div>
          <h3 className="font-heading font-bold text-surface-900 dark:text-white text-xl tracking-tight">{internship.title}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={internship.status} />
            {internship.workType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ring-1 uppercase bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 ring-surface-200 dark:ring-surface-700 capitalize">
                {internship.workType}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Building2,   label: 'Company',  value: internship.companyName },
            { icon: CalendarDays,label: 'Posted',   value: formatDate(internship.createdAt) },
            { icon: Clock,       label: 'Deadline', value: formatDate(internship.deadline) },
            { icon: MapPin,      label: 'Location', value: internship.location || '--' },
            { icon: Users,       label: 'Applicants', value: internship.applicantCount ?? '--' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-900/50">
              <Icon size={14} className="text-surface-400 dark:text-surface-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">{label}</p>
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{value}</p>
              </div>
            </div>
          ))}
        </div>
        {internship.description && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">Description</p>
            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed line-clamp-5">{internship.description}</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ApproveRejectModal({ internship, mode, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  if (!internship) return null;
  const isApprove = mode === 'approve';
  return (
    <ModalShell
      title={isApprove ? 'Approve Internship' : 'Reject Internship'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400">Cancel</button>
          <button
            onClick={() => { onConfirm(internship.internshipId, mode, note); onClose(); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${isApprove ? 'bg-accent-600 hover:bg-accent-700 active:bg-accent-800 shadow-glow-sm focus-visible:ring-accent-500' : 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-[0_2px_8px_rgba(220,38,38,0.3)] focus-visible:ring-red-500'}`}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className={`flex items-center gap-3 p-4 rounded-xl ${isApprove ? 'bg-accent-50 dark:bg-accent-900/20 border border-accent-100 dark:border-accent-800/30' : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30'}`}>
          {isApprove
            ? <CheckCircle size={18} className="text-accent-600 dark:text-accent-400 shrink-0" />
            : <XCircle    size={18} className="text-red-600 dark:text-red-400 shrink-0" />}
          <div>
            <p className="text-sm font-bold text-surface-900 dark:text-white">{internship.title}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">{internship.companyName}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">
            {isApprove ? 'Note for employer (optional)' : 'Rejection reason (optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={isApprove ? 'Any approval notes...' : 'Explain why this is being rejected...'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 leading-relaxed transition-colors duration-150"
          />
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteModal({ internship, onClose, onConfirm }) {
  if (!internship) return null;
  return (
    <ModalShell title="Delete Internship" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400">Cancel</button>
        <button onClick={() => { onConfirm(internship.internshipId); onClose(); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Delete</button>
      </>
    }>
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <AlertTriangle size={24} className="text-white" />
        </div>
        <h3 className="font-heading font-bold text-surface-900 dark:text-white mb-2">Delete "{internship.title}"?</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
          All applications linked to this internship will also be removed. This action cannot be undone.
        </p>
      </div>
    </ModalShell>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function InternshipManagement() {
  const [internships, setInternships] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [viewItem, setViewItem] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getInternships(params);
      const { data, pagination } = res.data;
      setInternships((data || []).map(mapInternship));
      setTotal(pagination?.total || 0);
      setTotalPages(pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load internships.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  async function handleAction(id, mode, note) {
    try {
      if (mode === 'approve') {
        await adminAPI.approveInternship(id);
        toast.success('Internship approved.');
      } else {
        await adminAPI.rejectInternship(id, note);
        toast.success('Internship rejected.');
      }
      fetchInternships();
    } catch (err) {
      toast.error(`Failed to ${mode} internship.`);
    }
  }

  async function handleDelete(id) {
    try {
      await adminAPI.deleteInternship(id);
      toast.success('Internship deleted.');
      fetchInternships();
    } catch (err) {
      toast.error('Failed to delete internship.');
    }
  }

  const statuses = ['all', 'pending_approval', 'active', 'closed', 'rejected'];

  const currentPage = Math.min(page, totalPages);

  return (
    <DashboardLayout role="admin">
      {/* Modals */}
      {viewItem   && <ViewModal internship={viewItem} onClose={() => setViewItem(null)} />}
      {actionItem && <ApproveRejectModal internship={actionItem.internship} mode={actionItem.mode} onClose={() => setActionItem(null)} onConfirm={handleAction} />}
      {deleteItem && <DeleteModal internship={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />}

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
          <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">LISTINGS</p>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">Internship Management</h1>
          <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">Review, approve, reject, and manage all internship listings.</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="group relative rounded-xl overflow-hidden mb-6 bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
        <div className="relative p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-transparent transition-colors duration-150"
            />
          </div>
          <div className="relative shrink-0">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none cursor-pointer transition-colors duration-150"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
        <div className="relative">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-surface-100 dark:border-surface-700">
            <div className="w-9 h-9 rounded-xl bg-primary-800 flex items-center justify-center shadow-sm">
              <Briefcase size={16} className="text-white" />
            </div>
            <h2 className="font-heading font-bold text-surface-900 dark:text-white tracking-tight">All Internships</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-primary-500" />
            </div>
          ) : internships.length === 0 ? (
            <EmptyState icon={Briefcase} title="No internships found" message="Try adjusting your search or filter criteria." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30">
                      {['Title', 'Company', 'Status', 'Posted', 'Applicants', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700/30">
                    {internships.map((item) => (
                      <tr key={item.internshipId} className="hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors duration-100">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center shrink-0 shadow-sm">
                              <Briefcase size={14} className="text-white" />
                            </div>
                            <span className="font-bold text-surface-800 dark:text-surface-100 max-w-[160px] truncate">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-surface-500 dark:text-surface-400 whitespace-nowrap font-medium">{item.companyName}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
                        <td className="px-5 py-3.5 text-surface-400 dark:text-surface-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                        <td className="px-5 py-3.5 text-surface-600 dark:text-surface-300 font-bold">{item.applicantCount ?? '--'}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <ActionBtn icon={Eye}         title="View"    onClick={() => setViewItem(item)}   cls="text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20" />
                            {(item.status === 'pending_approval' || item.status === 'closed') && (
                              <ActionBtn icon={CheckCircle} title="Approve" onClick={() => setActionItem({ internship: item, mode: 'approve' })} cls="text-surface-500 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20" />
                            )}
                            {(item.status === 'pending_approval' || item.status === 'active') && (
                              <ActionBtn icon={XCircle}     title="Reject"  onClick={() => setActionItem({ internship: item, mode: 'reject' })} cls="text-surface-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" />
                            )}
                            <ActionBtn icon={Trash2}       title="Delete"  onClick={() => setDeleteItem(item)} cls="text-surface-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" />
                          </div>
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
                  <PaginationBtn icon={ChevronLeft}  disabled={currentPage === 1}          onClick={() => setPage((p) => p - 1)} />
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
                  <PaginationBtn icon={ChevronRight} disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ActionBtn({ icon: Icon, title, onClick, cls }) {
  return (
    <button title={title} onClick={onClick} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${cls}`}>
      <Icon size={14} />
    </button>
  );
}

function PaginationBtn({ icon: Icon, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
      <Icon size={15} />
    </button>
  );
}
