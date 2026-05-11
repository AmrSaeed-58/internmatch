import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowRight, History } from 'lucide-react';
import StatusBadge from './StatusBadge';
import * as employerAPI from '../api/employer';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

/**
 * ApplicationHistoryModal
 * @param {object}   applicant         { applicationId, fullName }
 * @param {function} onClose
 */
export default function ApplicationHistoryModal({ applicant, onClose }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!applicant?.applicationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    employerAPI.getApplicationHistory(applicant.applicationId)
      .then((res) => { if (!cancelled) setHistory(res.data.data || []); })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load history');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applicant?.applicationId]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!applicant) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.95, y: 12, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-floating overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-700 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-2">
                <History size={16} className="text-primary-500" />
                Application history
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                {applicant.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 transition-colors duration-150 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-surface-500">
                <Loader2 size={18} className="animate-spin mr-2" /> Loading history...
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-4 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 p-4 text-sm text-surface-600 dark:text-surface-400">
                No status changes recorded yet.
              </div>
            ) : (
              <ol className="space-y-3">
                {history.map((h, i) => (
                  <li key={i} className="rounded-xl border border-surface-200 dark:border-surface-700 p-3.5 bg-white dark:bg-surface-800/40">
                    <div className="flex items-center gap-2 text-sm">
                      {h.oldStatus ? <StatusBadge status={h.oldStatus} /> : (
                        <span className="text-xs text-surface-400">created</span>
                      )}
                      <ArrowRight size={12} className="text-surface-400" />
                      <StatusBadge status={h.newStatus} />
                    </div>
                    <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                      {formatDate(h.createdAt)}
                      {h.changedBy ? ` · ${h.changedBy}${h.changedByRole ? ` (${h.changedByRole})` : ''}` : ''}
                    </div>
                    {h.note && (
                      <p className="mt-2 text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap leading-relaxed">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-surface-400 dark:text-surface-500 block mb-1">
                          Internal note
                        </span>
                        {h.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="px-6 py-4 bg-surface-50 dark:bg-surface-800/40 border-t border-surface-100 dark:border-surface-700 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-bold text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
