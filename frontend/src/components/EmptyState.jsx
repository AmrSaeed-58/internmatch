import { motion } from 'framer-motion';

/**
 * EmptyState
 * @param {React.ElementType} icon - Lucide icon component
 * @param {string} title - Heading text
 * @param {string} message - Supporting description text
 * @param {string} actionLabel - CTA button label (optional)
 * @param {function} onAction - CTA button handler (optional)
 * @param {string} actionTo - Link href instead of button (optional)
 * @param {'page'|'section'} size - Layout size variant
 */
export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  message = '',
  actionLabel,
  onAction,
  actionTo,
  size = 'section',
  className = '',
}) {
  const isPage = size === 'page';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 24 }}
      className={`flex flex-col items-center justify-center text-center ${
        isPage ? 'min-h-[60vh] py-16' : 'py-12 px-6'
      } ${className}`}
    >
      {/* Icon bubble */}
      {Icon && (
        <div className="mb-5 w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none">
          <Icon
            size={30}
            className="text-surface-400 dark:text-surface-500"
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* Title */}
      <h3 className="font-heading font-semibold text-surface-800 dark:text-surface-100 text-lg mb-2 leading-snug">
        {title}
      </h3>

      {/* Message */}
      {message && (
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm leading-relaxed mb-6">
          {message}
        </p>
      )}

      {/* CTA */}
      {actionLabel && (onAction || actionTo) && (
        <>
          {actionTo ? (
            <a
              href={actionTo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900"
            >
              {actionLabel}
            </a>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
