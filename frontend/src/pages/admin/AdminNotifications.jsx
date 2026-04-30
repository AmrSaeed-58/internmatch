import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
  Sparkles,
  UserPlus,
  Clock,
  UserX,
  CheckCheck,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import * as adminAPI from '../../api/admin';

// Notification type → icon (includes admin-only types). Keys must match the
// literal `type` strings the backend writes into the notification table.
// See notificationService.js for the canonical list.
const TYPE_ICON_MAP = {
  new_application: Bell,
  application_status_change: FileText,
  new_message: MessageSquare,
  internship_approved: CheckCircle,
  internship_rejected: XCircle,
  invitation_received: Send,
  welcome: Sparkles,
  new_user_registered: UserPlus,
  internship_pending_review: Clock,
  user_deactivated: UserX,
};

const TYPE_GRADIENT_MAP = {
  new_application: 'from-primary-500 to-primary-600',
  application_status_change: 'from-amber-500 to-amber-600',
  new_message: 'from-violet-500 to-violet-600',
  internship_approved: 'from-accent-500 to-accent-600',
  internship_rejected: 'from-red-500 to-red-600',
  invitation_received: 'from-sky-500 to-sky-600',
  welcome: 'from-amber-400 to-orange-500',
  new_user_registered: 'from-emerald-500 to-emerald-600',
  internship_pending_review: 'from-amber-500 to-amber-600',
  user_deactivated: 'from-red-500 to-red-600',
};

// ── relative time helper ────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── navigation target helper ────────────────────────────────────────────────────
function getNotificationLink(notification) {
  const { referenceType } = notification;
  switch (referenceType) {
    case 'application':
      return '/admin/internships';
    case 'internship':
      return '/admin/internships';
    case 'user':
      return '/admin/users';
    case 'message':
      return null;
    default:
      return null;
  }
}

// ── map snake_case API response to camelCase ────────────────────────────────────
function mapNotification(n) {
  return {
    notificationId: n.notification_id,
    type: n.type,
    title: n.title,
    message: n.message,
    referenceId: n.reference_id,
    referenceType: n.reference_type,
    isRead: n.is_read,
    createdAt: n.created_at,
  };
}

// ── pagination ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (showUnreadOnly) params.unreadOnly = true;
      const res = await adminAPI.getNotifications(params);
      const mapped = (res.data.data || []).map(mapNotification);
      setNotifications(mapped);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setUnreadCount(mapped.filter((n) => !n.isRead).length);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, showUnreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id) {
    try {
      await adminAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new Event('internmatch:notifications-changed'));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  }

  async function markAllAsRead() {
    try {
      await adminAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event('internmatch:notifications-changed'));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  }

  function handleClick(notification) {
    if (!notification.isRead) markAsRead(notification.notificationId);
    const link = getNotificationLink(notification);
    if (link) navigate(link);
  }

  return (
    <DashboardLayout role="admin">
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">ALERTS CENTER</p>
              <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                Notifications
              </h1>
              <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''} awaiting your attention.`
                  : 'You\u2019re all caught up. No unread notifications.'}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/25 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <CheckCheck size={16} />
                Mark All as Read
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mobile mark-all + filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="sm:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-700 to-primary-800 text-white text-sm font-semibold shadow-glow-sm hover:from-primary-800 hover:to-primary-900 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <CheckCheck size={16} />
            Mark All as Read
          </button>
        )}

        <div className="flex items-center gap-2.5 ml-auto">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
            <Filter size={14} className="text-white" />
          </div>
          <button
            onClick={() => {
              setShowUnreadOnly((v) => !v);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 ${
              showUnreadOnly
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
                : 'text-surface-600 dark:text-surface-400 hover:text-primary-700 dark:hover:text-primary-300'
            }`}
          >
            Unread Only
          </button>
        </div>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
          message={
            showUnreadOnly
              ? 'All notifications have been read.'
              : 'System notifications about users, internships, and platform activity will appear here.'
          }
          actionLabel={showUnreadOnly ? 'Show all' : undefined}
          onAction={showUnreadOnly ? () => setShowUnreadOnly(false) : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const Icon = TYPE_ICON_MAP[notification.type] || Bell;
            const gradient = TYPE_GRADIENT_MAP[notification.type] || 'from-surface-400 to-surface-500';

            return (
              <motion.button
                key={notification.notificationId}
                
                onClick={() => handleClick(notification)}
                className="group w-full text-left relative rounded-xl overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700/50"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                  notification.isRead
                    ? 'from-primary-400/10 via-transparent to-accent-400/6'
                    : 'from-primary-400/20 via-primary-300/10 to-accent-400/10'
                }`} />
                <div className="relative p-4 sm:p-5 flex items-start gap-4">
                  {/* Unread dot */}
                  {!notification.isRead && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary-500 shadow-glow-sm shrink-0" />
                  )}

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={18} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className={`font-heading text-sm leading-tight tracking-tight truncate ${
                      notification.isRead
                        ? 'font-semibold text-surface-700 dark:text-surface-300'
                        : 'font-bold text-surface-900 dark:text-white'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 font-medium">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="group relative rounded-xl overflow-hidden cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          >
            <span className="relative block px-3.5 py-2 text-sm font-bold text-surface-600 dark:text-surface-400">
              Previous
            </span>
          </button>
          <span className="text-sm text-surface-500 dark:text-surface-400 px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="group relative rounded-xl overflow-hidden cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          >
            <span className="relative block px-3.5 py-2 text-sm font-bold text-surface-600 dark:text-surface-400">
              Next
            </span>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
