const STATUS_CONFIG = {
  // Application statuses
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/50',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/50',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 ring-violet-200 dark:ring-violet-800/50',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 ring-accent-200 dark:ring-accent-800/50',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/50',
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400 ring-surface-200 dark:ring-surface-700',
  },
  // Internship statuses
  active: {
    label: 'Active',
    className: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 ring-accent-200 dark:ring-accent-800/50',
  },
  closed: {
    label: 'Closed',
    className: 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400 ring-surface-200 dark:ring-surface-700',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200 dark:ring-amber-800/50',
  },
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    className: 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400 ring-surface-200 dark:ring-surface-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ring-1 uppercase whitespace-nowrap ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
