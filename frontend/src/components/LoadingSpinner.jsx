/**
 * LoadingSpinner
 * @param {boolean} fullPage - centers and fills the entire viewport
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} label - optional accessible label
 */
export default function LoadingSpinner({
  fullPage = false,
  size = 'md',
  label = 'Loading…',
  className = '',
}) {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex flex-col items-center gap-3 ${className}`}
    >
      <div
        className={`${sizeMap[size] || sizeMap.md} rounded-full border-surface-200 dark:border-surface-700 border-t-primary-600 dark:border-t-primary-400 animate-spin`}
      />
      {fullPage && (
        <span className="text-sm text-surface-400 dark:text-surface-500 font-body">
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface-50 dark:bg-surface-950 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * InlineSpinner – convenience alias for quick inline usage
 */
export function InlineSpinner({ size = 'sm', className = '' }) {
  return <LoadingSpinner size={size} fullPage={false} className={className} />;
}

/**
 * PageSpinner – convenience alias for full-page loading without overlay
 */
export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <LoadingSpinner size="lg" label={label} />
      <p className="text-sm text-surface-400 dark:text-surface-500 font-body">{label}</p>
    </div>
  );
}
