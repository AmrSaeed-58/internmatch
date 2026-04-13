import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = user?.role ? `/${user.role}/dashboard` : '/';

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 font-body flex items-center justify-center px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-100/40 dark:bg-primary-900/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent-100/30 dark:bg-accent-900/10 blur-[100px]" />
        <div className="fixed inset-0 grain-texture opacity-20 dark:opacity-10" />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto animate-fade-in-up">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-elevated flex items-center justify-center">
          <Compass
            size={36}
            className="text-primary-500 dark:text-primary-400"
            strokeWidth={1.5}
          />
        </div>

        <div className="font-heading font-bold text-[5rem] leading-none tracking-tight bg-gradient-to-br from-primary-400 via-primary-600 to-primary-800 dark:from-primary-300 dark:via-primary-500 dark:to-primary-700 bg-clip-text text-transparent mb-4 select-none">
          404
        </div>

        <h1 className="font-heading font-semibold text-2xl text-surface-900 dark:text-white mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-surface-500 dark:text-surface-400 leading-relaxed mb-8 text-sm">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 shadow-card hover:shadow-card-hover transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
          <Link
            to={dashboardPath}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold transition-colors duration-200 cursor-pointer shadow-[0_2px_12px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.4)] focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
