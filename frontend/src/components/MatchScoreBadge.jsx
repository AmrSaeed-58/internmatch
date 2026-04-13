function getScoreConfig(score) {
  if (score >= 80) {
    return {
      label: 'High Match',
      textClass: 'text-accent-600 dark:text-accent-400',
      bgClass: 'bg-accent-50 dark:bg-accent-900/20',
      ringClass: 'ring-accent-200 dark:ring-accent-800/50',
      barClass: 'bg-accent-500',
      dotClass: 'bg-accent-500',
    };
  }
  if (score >= 50) {
    return {
      label: 'Good Match',
      textClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
      ringClass: 'ring-amber-200 dark:ring-amber-800/50',
      barClass: 'bg-amber-500',
      dotClass: 'bg-amber-500',
    };
  }
  return {
    label: 'Low Match',
    textClass: 'text-surface-500 dark:text-surface-400',
    bgClass: 'bg-surface-100 dark:bg-surface-700/30',
    ringClass: 'ring-surface-200 dark:ring-surface-700',
    barClass: 'bg-surface-400 dark:bg-surface-500',
    dotClass: 'bg-surface-400 dark:bg-surface-500',
  };
}

/**
 * MatchScoreBadge
 * @param {number} score - 0 to 100
 * @param {'pill'|'compact'} variant - display variant
 */
export default function MatchScoreBadge({ score, variant = 'pill', className = '' }) {
  const safeScore = typeof score === 'number' ? Math.round(Math.max(0, Math.min(100, score))) : null;

  if (safeScore === null) return null;

  const config = getScoreConfig(safeScore);

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ring-1 ${config.bgClass} ${config.textClass} ${config.ringClass} ${className}`}
        title={`${safeScore}% match score — ${config.label}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        {safeScore}%
      </span>
    );
  }

  // Default pill variant with mini progress bar
  return (
    <div
      className={`inline-flex flex-col gap-1 px-3 py-1.5 rounded-lg ring-1 ${config.bgClass} ${config.ringClass} ${className}`}
      title={`${safeScore}% match score`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-semibold ${config.textClass}`}>
          {config.label}
        </span>
        <span className={`text-sm font-bold tabular-nums ${config.textClass}`}>
          {safeScore}%
        </span>
      </div>
      <div className="w-full h-1 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${config.barClass}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}
