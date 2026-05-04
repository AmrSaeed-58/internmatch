import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Search,
  Users,
  Filter,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  User,
  Mail,
  CalendarDays,
  Shield,
  GraduationCap,
  Briefcase,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import * as adminAPI from '../../api/admin';

const PAGE_SIZE = 20;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function roleConfig(role) {
  switch (role) {
    case 'student':  return { label: 'Student',  icon: GraduationCap, cls: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 ring-primary-200 dark:ring-primary-800/50' };
    case 'employer': return { label: 'Employer', icon: Briefcase,     cls: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-violet-200 dark:ring-violet-800/50' };
    case 'admin':    return { label: 'Admin',    icon: Shield,        cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/50' };
    default:         return { label: role,       icon: User,          cls: 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 ring-surface-200 dark:ring-surface-700' };
  }
}

function RoleBadge({ role }) {
  const { label, icon: Icon, cls } = roleConfig(role);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ring-1 uppercase whitespace-nowrap ${cls}`}>
      <Icon size={10} strokeWidth={2.5} />
      {label}
    </span>
  );
}

function ModalShell({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 dark:bg-surface-950/70 backdrop-blur-sm">
      <div className="relative rounded-xl shadow-floating w-full max-w-lg flex flex-col max-h-[90vh] animate-scale-in overflow-hidden bg-white dark:bg-dark-card">
        <div className="relative flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700 shrink-0">
            <h2 className="font-heading font-bold text-surface-900 dark:text-white text-lg tracking-tight">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50 hover:text-surface-600 dark:hover:text-surface-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
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

function ViewModal({ user, onClose }) {
  if (!user) return null;
  return (
    <ModalShell title="User Details" onClose={onClose} footer={
      <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400">Close</button>
    }>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-heading font-extrabold text-xl tracking-tight shadow-lg">
          {user.fullName.charAt(0)}
        </div>
        <div>
          <h3 className="font-heading font-bold text-surface-900 dark:text-white text-xl tracking-tight">{user.fullName}</h3>
          <RoleBadge role={user.role} />
        </div>
      </div>
      <div className="space-y-3">
        {[
          { icon: Mail,        label: 'Email',   value: user.email },
          { icon: CalendarDays,label: 'Joined',  value: formatDate(user.createdAt) },
          { icon: CheckCircle, label: 'Status',  value: user.isActive ? 'Active' : 'Deactivated' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-50 dark:bg-surface-900/50">
            <Icon size={15} className="text-surface-400 dark:text-surface-500 shrink-0" />
            <span className="text-sm text-surface-500 dark:text-surface-400 w-16 shrink-0 font-bold">{label}</span>
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">{value}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function EditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ fullName: user?.fullName || '', email: user?.email || '', role: user?.role || 'student' });
  if (!user) return null;
  function handleSave() { onSave(user.userId, form); onClose(); }
  return (
    <ModalShell title="Edit User" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-glow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">Save Changes</button>
      </>
    }>
      <div className="space-y-4">
        {[
          { key: 'fullName', label: 'Full Name', type: 'text' },
          { key: 'email',    label: 'Email',     type: 'email' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
          >
            <option value="student">Student</option>
            <option value="employer">Employer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteModal({ user, onClose, onConfirm }) {
  if (!user) return null;
  return (
    <ModalShell title="Delete User" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400">Cancel</button>
        <button onClick={() => { onConfirm(user.userId); onClose(); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Delete</button>
      </>
    }>
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <AlertTriangle size={24} className="text-white" />
        </div>
        <h3 className="font-heading font-bold text-surface-900 dark:text-white mb-2">Delete "{user.fullName}"?</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
          This action is permanent and will cascade-delete all owned data. This cannot be undone.
        </p>
      </div>
    </ModalShell>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await adminAPI.getUsers(params);
      const rawUsers = res.data.data || [];
      const normalized = rawUsers.map((u) => ({
        userId: u.userId || u.user_id,
        fullName: u.fullName || u.full_name,
        email: u.email,
        role: u.role,
        isActive: u.isActive !== undefined ? u.isActive : u.is_active,
        createdAt: u.createdAt || u.created_at,
      }));
      setUsers(normalized);
      setPagination(res.data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function toggleActive(userId) {
    try {
      await adminAPI.toggleUserActive(userId);
      const user = users.find((u) => u.userId === userId);
      toast.success(`${user.fullName} has been ${user.isActive ? 'deactivated' : 'activated'}.`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  }

  async function handleSave(userId, form) {
    try {
      await adminAPI.updateUser(userId, { fullName: form.fullName, email: form.email });
      toast.success('User updated successfully.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user.');
    }
  }

  async function handleDelete(userId) {
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  }

  const totalPages = pagination.totalPages;
  const total = pagination.total;

  return (
    <DashboardLayout role="admin">
      {/* Modals */}
      {viewUser        && <ViewModal   user={viewUser}        onClose={() => setViewUser(null)} />}
      {editUser        && <EditModal   user={editUser}        onClose={() => setEditUser(null)}        onSave={handleSave} />}
      {deleteUserTarget && <DeleteModal user={deleteUserTarget} onClose={() => setDeleteUserTarget(null)} onConfirm={handleDelete} />}

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
          <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">PLATFORM USERS</p>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">User Management</h1>
          <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">Search, filter, and manage all platform users.</p>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-transparent transition-colors duration-150"
            />
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="pl-8 pr-8 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none cursor-pointer transition-colors duration-150"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="employer">Employer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none cursor-pointer transition-colors duration-150"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
        <div className="relative">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-surface-100 dark:border-surface-700">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
              <Users size={16} className="text-white" />
            </div>
            <h2 className="font-heading font-bold text-surface-900 dark:text-white tracking-tight">All Users</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-primary-500" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No users found" message="Try adjusting your search or filter criteria." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/30">
                      {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700/30">
                    {users.map((user) => (
                      <tr key={user.userId} className="hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors duration-100">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-heading font-extrabold text-sm shrink-0 shadow-lg">
                              {user.fullName.charAt(0)}
                            </div>
                            <span className="font-bold text-surface-800 dark:text-surface-100 whitespace-nowrap">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-surface-500 dark:text-surface-400 whitespace-nowrap font-medium">{user.email}</td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.isActive ? 'text-accent-600 dark:text-accent-400' : 'text-surface-400 dark:text-surface-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-accent-500' : 'bg-surface-300 dark:bg-surface-600'}`} />
                            {user.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-surface-400 dark:text-surface-500 whitespace-nowrap font-medium">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <ActionBtn icon={Eye}        title="View"       onClick={() => setViewUser(user)}   cls="text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20" />
                            <ActionBtn icon={Pencil}     title="Edit"       onClick={() => setEditUser(user)}   cls="text-surface-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20" />
                            <ActionBtn icon={user.isActive ? UserX : UserCheck} title={user.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(user.userId)} cls={user.isActive ? 'text-surface-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-surface-500 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20'} />
                            <ActionBtn icon={Trash2}     title="Delete"     onClick={() => setDeleteUserTarget(user)} cls="text-surface-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" />
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
                  Showing {((page - 1) * PAGE_SIZE) + 1}--{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-1.5">
                  <PaginationBtn icon={ChevronLeft}  disabled={page === 1}          onClick={() => setPage((p) => p - 1)} />
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        pg === page
                          ? 'bg-primary-600 text-white shadow-glow-sm'
                          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700/50'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <PaginationBtn icon={ChevronRight} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} />
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
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${cls}`}
    >
      <Icon size={14} />
    </button>
  );
}

function PaginationBtn({ icon: Icon, disabled, onClick }) {
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
