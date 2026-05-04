import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

// Status names MUST match the enum in `application.status` (Schema.sql).
export const STATUS_TRANSITIONS = {
  pending: ['under_review', 'rejected'],
  under_review: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['accepted', 'rejected'],
  accepted: ['rejected'],
  rejected: [],
  withdrawn: [],
};

const STATUS_META = {
  under_review: {
    label: 'Move to Under Review',
    description: 'Mark this application as actively being reviewed.',
    tone: 'primary',
  },
  interview_scheduled: {
    label: 'Schedule Interview',
    description: 'Confirm an interview has been arranged with the candidate.',
    tone: 'primary',
  },
  accepted: {
    label: 'Accept Candidate',
    description: 'Offer this candidate the position. They will be notified immediately.',
    tone: 'accent',
    requiresConfirm: true,
  },
  rejected: {
    label: 'Reject Application',
    description: 'Decline this application. The candidate will see this status update.',
    tone: 'danger',
    requiresConfirm: true,
  },
};

const TONE_BUTTON = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
  accent: 'bg-accent-600 hover:bg-accent-700 text-white shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

const TONE_RING = {
  primary: 'ring-primary-500/30 border-primary-500/40 bg-primary-50/40 dark:bg-primary-900/10',
  accent: 'ring-accent-500/30 border-accent-500/40 bg-accent-50/40 dark:bg-accent-900/10',
  danger: 'ring-red-500/30 border-red-500/40 bg-red-50/40 dark:bg-red-900/10',
};

function humanize(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * StatusChangeModal
 * @param {object}   applicant         { fullName, status, applicationId }
 * @param {function} onClose
 * @param {function} onSubmit          async ({ status, note }) => void
 */
export default function StatusChangeModal({ applicant, onClose, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const transitions = applicant ? (STATUS_TRANSITIONS[applicant.status] || []) : [];

  // Reset state whenever the modal target changes
  useEffect(() => {
    setSelected(null);
    setNote('');
    setConfirming(false);
    setSubmitting(false);
  }, [applicant?.applicationId]);

  // Allow Esc to close (when not submitting)
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitting, onClose]);

  if (!applicant) return null;

  const meta = selected ? STATUS_META[selected] : null;
  const isTerminal = transitions.length === 0;

  async function handleSubmit() {
    if (!selected) return;
    if (meta?.requiresConfirm && !confirming) {
      setConfirming(true);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ status: selected, note: note.trim() || null });
      onClose();
    } catch {
      // Caller surfaces the toast; just stop the spinner.
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
          onClick={() => !submitting && onClose()}
        />
        <motion.div
          initial={{ scale: 0.95, y: 12, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-floating overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-700 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold text-surface-900 dark:text-white tracking-tight">
                Update application status
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                {applicant.fullName}
              </p>
            </div>
            <button
              onClick={() => !submitting && onClose()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200 transition-colors duration-150 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Current status */}
          <div className="px-6 pt-5">
            <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 font-bold uppercase tracking-wide mb-2">
              Current status
            </div>
            <div className="flex items-center gap-2 mb-5">
              <StatusBadge status={applicant.status} />
              {selected && (
                <>
                  <ArrowRight size={14} className="text-surface-400" />
                  <StatusBadge status={selected} />
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-5">
            {isTerminal ? (
              <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 p-4 text-sm text-surface-600 dark:text-surface-400">
                This application is in a final state ({humanize(applicant.status)}) and cannot be changed further.
              </div>
            ) : (
              <>
                <div className="text-xs text-surface-500 dark:text-surface-400 font-bold uppercase tracking-wide mb-2">
                  Move to
                </div>
                <div className="space-y-2">
                  {transitions.map((s) => {
                    const m = STATUS_META[s];
                    const isSel = selected === s;
                    return (
                      <button
                        key={s}
                        onClick={() => { setSelected(s); setConfirming(false); }}
                        disabled={submitting}
                        className={`w-full text-left rounded-xl border-2 p-3.5 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isSel
                            ? `ring-2 ${TONE_RING[m.tone]}`
                            : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                            isSel
                              ? m.tone === 'danger'
                                ? 'border-red-500 bg-red-500'
                                : m.tone === 'accent'
                                ? 'border-accent-500 bg-accent-500'
                                : 'border-primary-500 bg-primary-500'
                              : 'border-surface-300 dark:border-surface-600'
                          }`}>
                            {isSel && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-surface-900 dark:text-white">
                              {m.label}
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 leading-relaxed">
                              {m.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Note */}
                <div className="mt-5">
                  <label className="text-xs text-surface-500 dark:text-surface-400 font-bold uppercase tracking-wide mb-2 block">
                    Internal note <span className="text-surface-400 normal-case font-medium">(optional, not shown to candidate)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="e.g. Reviewed CV, strong match — moving forward to interview round."
                    className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm placeholder:text-surface-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 resize-y"
                  />
                  <p className="text-[11px] text-surface-400 mt-1 text-right tabular-nums">
                    {note.length} / 1000
                  </p>
                </div>

                {confirming && meta && (
                  <div className={`mt-4 rounded-xl border p-3.5 flex items-start gap-3 ${
                    meta.tone === 'danger'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
                      : 'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800/40'
                  }`}>
                    <AlertTriangle size={16} className={meta.tone === 'danger' ? 'text-red-600 dark:text-red-400 mt-0.5 shrink-0' : 'text-accent-600 dark:text-accent-400 mt-0.5 shrink-0'} />
                    <div className="text-sm">
                      <p className="font-bold text-surface-900 dark:text-white">Are you sure?</p>
                      <p className="text-surface-600 dark:text-surface-300 mt-0.5">
                        {meta.tone === 'danger'
                          ? 'This will reject the candidate and notify them. The status can still be reverted later.'
                          : 'This will mark the candidate as accepted and notify them.'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-surface-50 dark:bg-surface-800/40 border-t border-surface-100 dark:border-surface-700 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-bold text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-800 disabled:opacity-50 transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            {!isTerminal && (
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  meta ? TONE_BUTTON[meta.tone] : 'bg-primary-600 text-white'
                }`}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {confirming ? 'Confirm' : 'Update Status'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
