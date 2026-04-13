import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Briefcase,
  Sparkles,
  FileText,
  Bookmark,
  MessageSquare,
  Settings,
  PlusSquare,
  ListChecks,
  Users,
  BarChart2,
  ScrollText,
  TrendingUp,
  X,
  Layers,
} from 'lucide-react';

const NAV_ITEMS = {
  student: [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, color: 'from-primary-500 to-primary-700' },
    { label: 'Profile', path: '/student/profile', icon: User, color: 'from-accent-500 to-accent-700' },
    { label: 'Internships', path: '/student/internships', icon: Briefcase, color: 'from-blue-500 to-blue-700' },
    { label: 'Recommendations', path: '/student/recommendations', icon: Sparkles, color: 'from-amber-500 to-orange-600' },
    { label: 'Applications', path: '/student/applications', icon: FileText, color: 'from-teal-500 to-teal-700' },
    { label: 'Saved', path: '/student/saved', icon: Bookmark, color: 'from-pink-500 to-rose-600' },
    { label: 'Messages', path: '/student/messages', icon: MessageSquare, color: 'from-indigo-500 to-indigo-700' },
    { label: 'Settings', path: '/student/settings', icon: Settings, color: 'from-surface-500 to-surface-700' },
  ],
  employer: [
    { label: 'Dashboard', path: '/employer/dashboard', icon: LayoutDashboard, color: 'from-primary-500 to-primary-700' },
    { label: 'Profile', path: '/employer/profile', icon: User, color: 'from-accent-500 to-accent-700' },
    { label: 'Post Internship', path: '/employer/internships/new', icon: PlusSquare, color: 'from-green-500 to-green-700' },
    { label: 'Manage Internships', path: '/employer/internships', icon: ListChecks, color: 'from-blue-500 to-blue-700' },
    { label: 'Candidates', path: '/employer/candidates', icon: Users, color: 'from-amber-500 to-orange-600' },
    { label: 'Analytics', path: '/employer/analytics', icon: BarChart2, color: 'from-pink-500 to-rose-600' },
    { label: 'Messages', path: '/employer/messages', icon: MessageSquare, color: 'from-indigo-500 to-indigo-700' },
    { label: 'Settings', path: '/employer/settings', icon: Settings, color: 'from-surface-500 to-surface-700' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, color: 'from-primary-500 to-primary-700' },
    { label: 'Users', path: '/admin/users', icon: Users, color: 'from-accent-500 to-accent-700' },
    { label: 'Internships', path: '/admin/internships', icon: Briefcase, color: 'from-blue-500 to-blue-700' },
    { label: 'Logs', path: '/admin/logs', icon: ScrollText, color: 'from-amber-500 to-orange-600' },
    { label: 'Reports', path: '/admin/reports', icon: TrendingUp, color: 'from-pink-500 to-rose-600' },
    { label: 'Settings', path: '/admin/settings', icon: Settings, color: 'from-surface-500 to-surface-700' },
  ],
};

export default function Sidebar({ role = 'student', open, onClose }) {
  const location = useLocation();
  const items = NAV_ITEMS[role] || NAV_ITEMS.student;

  function isActive(path) {
    const pathname = location.pathname;
    if (pathname === path) return true;
    if (path.endsWith('/dashboard')) return false;
    if (items.some((item) => item.path === pathname)) return false;
    return pathname.startsWith(path + '/');
  }

  const sidebarContent = (
    <nav className="flex flex-col h-full py-6 px-4 gap-1.5">
      {items.map(({ label, path, icon: Icon, color }) => {
        const active = isActive(path);
        return (
          <Link
            key={path}
            to={path}
            onClick={onClose}
            className={`group relative flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-semibold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-600 ${
              active
                ? 'bg-white dark:bg-surface-800 shadow-card text-surface-900 dark:text-white'
                : 'text-surface-600 dark:text-surface-400 hover:bg-white/60 dark:hover:bg-surface-800/40 hover:text-surface-900 dark:hover:text-surface-100'
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-primary-500 to-accent-500" />
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
              active
                ? `bg-gradient-to-br ${color} shadow-lg`
                : 'bg-surface-100 dark:bg-surface-800 group-hover:bg-gradient-to-br group-hover:' + color.replace('from-', 'from-').replace('to-', 'to-')
            }`}>
              <Icon
                size={20}
                className={`transition-colors duration-200 ${
                  active
                    ? 'text-white'
                    : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-700 dark:group-hover:text-surface-200'
                }`}
              />
            </div>
            <span className="truncate flex-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-5rem)] sticky top-20 bg-gradient-to-b from-white via-white to-primary-50/40 dark:from-surface-900 dark:via-surface-900 dark:to-primary-950/20 border-r border-surface-200 dark:border-surface-800 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-surface-900/50 dark:bg-surface-950/70 animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative flex flex-col w-64 h-full bg-white dark:bg-surface-900 shadow-floating z-50 overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between px-4 h-20 border-b border-surface-200 dark:border-surface-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm">
                  <Layers size={18} className="text-white" />
                </div>
                <span className="font-heading font-bold text-lg tracking-tight text-surface-900 dark:text-white">
                  Intern<span className="text-primary-600">Match</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
