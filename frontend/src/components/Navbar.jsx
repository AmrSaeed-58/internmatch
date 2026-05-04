import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BellRing,
  MessagesSquare,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  UserCircle2,
  Settings,
  Menu,
  X,
  BrainCircuit,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import * as studentAPI from '../api/student';
import * as employerAPI from '../api/employer';
import * as adminAPI from '../api/admin';
import * as messagesAPI from '../api/messages';

const ROLE_LABELS = {
  student: 'Student',
  employer: 'Employer',
  admin: 'Admin',
};

const ROLE_COLORS = {
  student: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  employer: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  admin: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Navbar({ onMenuToggle, mobileMenuOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const [unreadMessages, setUnreadMessages] = useState(0);

  const role = user?.role || 'student';
  const dashboardPath = `/${role}/dashboard`;
  const profilePath = role === 'admin' ? '/admin/settings' : `/${role}/profile`;
  const settingsPath = `/${role}/settings`;

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch recent notifications — runs on mount, role change, route change, window focus,
  // a periodic poll, and a custom event dispatched by notification pages.
  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      let res;
      if (role === 'student') res = await studentAPI.getNotifications({ limit: 5 });
      else if (role === 'employer') res = await employerAPI.getNotifications({ limit: 5 });
      else if (role === 'admin') res = await adminAPI.getNotifications({ limit: 5 });
      if (res) setNotifications(res.data.data || []);
    } catch { /* ignore */ }
  }, [user, role]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs, location.pathname]);

  useEffect(() => {
    if (!user) return undefined;
    const interval = setInterval(fetchNotifs, 30000);
    const onFocus = () => fetchNotifs();
    const onCustom = () => fetchNotifs();
    window.addEventListener('focus', onFocus);
    window.addEventListener('internmatch:notifications-changed', onCustom);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('internmatch:notifications-changed', onCustom);
    };
  }, [fetchNotifs, user]);

  const markRead = useCallback(async (id) => {
    try {
      if (role === 'student') await studentAPI.markNotificationRead(id);
      else if (role === 'employer') await employerAPI.markNotificationRead(id);
      else if (role === 'admin') await adminAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new Event('internmatch:notifications-changed'));
    } catch { /* ignore */ }
  }, [role]);

  const markAllRead = useCallback(async () => {
    try {
      if (role === 'student') await studentAPI.markAllNotificationsRead();
      else if (role === 'employer') await employerAPI.markAllNotificationsRead();
      else if (role === 'admin') await adminAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('internmatch:notifications-changed'));
    } catch { /* ignore */ }
  }, [role]);

  function getNotificationLink(n) {
    switch (n.referenceType) {
      case 'application':
        if (role === 'employer') {
          return n.referenceId
            ? `/employer/internship/${n.referenceId}/applicants`
            : '/employer/internships';
        }
        return '/student/applications';
      case 'internship':
        // Employers manage their own internships — keep them inside the
        // employer dashboard rather than the public student-facing page.
        if (role === 'employer') return '/employer/internships';
        if (role === 'admin') return '/admin/internships';
        return n.referenceId ? `/internship/${n.referenceId}` : null;
      case 'conversation':
        if (role === 'admin') return null;
        return n.referenceId
          ? `/${role}/messages?conversation=${n.referenceId}`
          : `/${role}/messages`;
      case 'user':
        return role === 'admin' ? '/admin/users' : null;
      default:
        return null;
    }
  }

  function handleDropdownItemClick(n) {
    if (!n.isRead) markRead(n.notificationId);
    const link = getNotificationLink(n);
    setNotifOpen(false);
    if (link) navigate(link);
  }

  // Fetch unread message count
  useEffect(() => {
    if (!user || role === 'admin') return;
    async function fetchUnread() {
      try {
        const res = await messagesAPI.getConversations({ limit: 50 });
        const total = (res.data.data || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessages(total);
      } catch { /* ignore */ }
    }
    fetchUnread();
  }, [user, role]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
      <div className="flex items-center h-full px-6 gap-4">
        {/* Hamburger (mobile) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex items-center justify-center w-11 h-11 rounded-xl text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo - bigger */}
        <Link
          to={dashboardPath}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow duration-200">
            <BrainCircuit size={22} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-surface-900 dark:text-white hidden sm:block">
            Intern<span className="text-primary-600 dark:text-primary-400">Match</span>
          </span>
        </Link>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={22} className="text-amber-400" /> : <Moon size={22} />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen((p) => !p); setProfileOpen(false); }}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
              aria-label="Notifications"
            >
              <BellRing size={22} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-cta-500 text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-surface-900">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-surface-800 rounded-xl shadow-floating border border-surface-200 dark:border-surface-700 overflow-hidden z-50 animate-scale-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <span className="font-heading font-semibold text-sm text-surface-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadNotifs > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 rounded"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-700/60">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-surface-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.notificationId}
                        type="button"
                        onClick={() => handleDropdownItemClick(n)}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:bg-surface-50 dark:focus-visible:bg-surface-700/40 ${
                          !n.isRead ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''
                        }`}
                      >
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-primary-600' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-800 dark:text-surface-100 leading-snug">
                            {n.title}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 leading-snug line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[11px] text-surface-400 dark:text-surface-500 mt-1 block">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-surface-100 dark:border-surface-700">
                  <Link
                    to={`/${role}/notifications`}
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          {role !== 'admin' && (
            <Link
              to={`/${role}/messages`}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
              aria-label="Messages"
            >
              <MessagesSquare size={22} />
              {unreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-surface-900">
                  {unreadMessages}
                </span>
              )}
            </Link>
          )}

          {/* Divider */}
          <div className="w-px h-7 bg-surface-200 dark:bg-surface-700 mx-2 hidden sm:block" />

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setProfileOpen((p) => !p); setNotifOpen(false); }}
              className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-surface-200 dark:ring-surface-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(user?.fullName)}
                </div>
              )}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-surface-800 dark:text-surface-100 leading-tight max-w-[120px] truncate">
                  {user?.fullName || 'User'}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold leading-tight mt-1 ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-surface-400 hidden sm:block transition-transform duration-150 ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-52 bg-white dark:bg-surface-800 rounded-xl shadow-floating border border-surface-200 dark:border-surface-700 overflow-hidden z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  {role !== 'admin' && (
                    <Link
                      to={profilePath}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors duration-150 cursor-pointer"
                    >
                      <UserCircle2 size={14} className="text-surface-400" />
                      My Profile
                    </Link>
                  )}
                  <Link
                    to={settingsPath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700/40 transition-colors duration-150 cursor-pointer"
                  >
                    <Settings size={14} className="text-surface-400" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-surface-100 dark:border-surface-700 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 cursor-pointer"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
