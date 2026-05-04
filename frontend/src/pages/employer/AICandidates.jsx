import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  GraduationCap,
  Star,
  SlidersHorizontal,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import MatchScoreBadge from '../../components/MatchScoreBadge';
import EmptyState from '../../components/EmptyState';
import * as employerAPI from '../../api/employer';

function GraduationBadge({ status }) {
  const isGraduated = status === 'graduated';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ring-1 ${
      isGraduated
        ? 'bg-accent-50 text-accent-700 ring-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:ring-accent-800/30'
        : 'bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:ring-primary-800/30'
    }`}>
      <GraduationCap size={9} />
      {isGraduated ? 'Graduated' : 'Enrolled'}
    </span>
  );
}

export default function AICandidates() {
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [minScore, setMinScore] = useState(0);
  const [invitedIds, setInvitedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    async function fetchInternships() {
      try {
        const res = await employerAPI.getInternships({ limit: 50, status: 'active' });
        const list = res.data.data || [];
        setInternships(list);
        if (list.length > 0) {
          setSelectedInternship(String(list[0].internshipId));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load internships');
      } finally {
        setLoading(false);
      }
    }
    fetchInternships();
  }, []);

  useEffect(() => {
    if (!selectedInternship) return;
    async function fetchCandidates() {
      setLoadingCandidates(true);
      try {
        const res = await employerAPI.getCandidates(selectedInternship, { limit: 50 });
        setCandidates(res.data.data || []);
        // Track already-invited (backend returns `isInvited`)
        const invited = (res.data.data || []).filter((c) => c.isInvited).map((c) => c.studentUserId);
        setInvitedIds(invited);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load candidates');
        setCandidates([]);
      } finally {
        setLoadingCandidates(false);
      }
    }
    fetchCandidates();
  }, [selectedInternship]);

  const filtered = candidates
    .filter((c) => (c.matchScore || 0) >= minScore)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  async function handleInvite(studentUserId) {
    try {
      await employerAPI.inviteStudent(selectedInternship, studentUserId);
      setInvitedIds((prev) => [...prev, studentUserId]);
      toast.success('Invitation sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    }
  }

  const selectedInternshipName =
    internships.find((i) => String(i.internshipId) === String(selectedInternship))?.title || '';

  if (loading) {
    return (
      <DashboardLayout role="employer">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employer">
      <div className="space-y-6">
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
            <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">AI-POWERED MATCHING</p>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3 inline-flex items-center gap-3">
              <Sparkles size={26} className="text-accent-300" />
              AI Candidates
            </h1>
            <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
              AI-matched top candidates for your internship positions.
            </p>
          </div>
        </motion.div>

        {internships.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No active internships"
            message="Post an internship first to see AI-matched candidates."
          />
        ) : (
          <>
            {/* Controls */}
            <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
              <div className="relative p-5">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1.5 uppercase tracking-wide">
                      Internship Position
                    </label>
                    <div className="relative">
                      <select
                        value={selectedInternship}
                        onChange={(e) => setSelectedInternship(e.target.value)}
                        className="w-full appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors duration-150 cursor-pointer"
                      >
                        {internships.map((i) => (
                          <option key={i.internshipId} value={i.internshipId}>
                            {i.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1.5 uppercase tracking-wide">
                      <SlidersHorizontal size={11} className="inline mr-1" />
                      Minimum Match Score: <span className="text-primary-600 dark:text-primary-400">{minScore}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="w-full h-2 rounded-full bg-surface-200 dark:bg-surface-700 appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-surface-400 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-sm text-surface-500 dark:text-surface-400 pb-0.5">
                    <span className="font-extrabold text-surface-700 dark:text-surface-300">{filtered.length}</span> candidates
                  </div>
                </div>
              </div>
            </div>

            {selectedInternshipName && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 text-sm text-primary-700 dark:text-primary-300">
                <Sparkles size={14} />
                Showing top matches for: <span className="font-bold">{selectedInternshipName}</span>
              </div>
            )}

            {/* Candidates Grid */}
            {loadingCandidates ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-sm text-surface-400 dark:text-surface-500">
                {candidates.length === 0
                  ? 'No candidates found for this internship yet.'
                  : `No candidates meet the minimum score of ${minScore}%. Try lowering the filter.`}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                {filtered.map((candidate) => {
                  const isInvited = invitedIds.includes(candidate.studentUserId);
                  return (
                    <motion.div
                      key={candidate.studentUserId}
                      className="group h-full bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 hover:shadow-card-hover transition-shadow duration-200"
                    >
                      <div className="relative p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                            {(candidate.fullName || candidate.studentName || '?').charAt(0)}
                          </div>
                          <MatchScoreBadge score={Math.round(candidate.matchScore || 0)} variant="compact" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-surface-900 dark:text-white leading-tight">
                            {candidate.fullName || candidate.studentName}
                          </h3>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                            {candidate.major}
                          </p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                            {candidate.university}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs text-surface-500 dark:text-surface-400">
                            {candidate.gpa && (
                              <span className="inline-flex items-center gap-1">
                                <Star size={10} className="text-amber-400" fill="currentColor" />
                                GPA {Number(candidate.gpa).toFixed(2)}
                              </span>
                            )}
                            {candidate.graduationYear && (
                              <span className="inline-flex items-center gap-1">
                                <GraduationCap size={10} />
                                {candidate.graduationYear}
                              </span>
                            )}
                          </div>

                          {candidate.graduationStatus && (
                            <div className="mt-1">
                              <GraduationBadge status={candidate.graduationStatus} />
                            </div>
                          )}

                          {candidate.skills && candidate.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {candidate.skills.slice(0, 4).map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-[10px] font-medium border border-surface-200 dark:border-surface-700 max-w-[120px] truncate"
                                  title={typeof skill === 'string' ? skill : skill.displayName}
                                >
                                  {typeof skill === 'string' ? skill : skill.displayName}
                                </span>
                              ))}
                              {candidate.skills.length > 4 && (
                                <span className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-semibold border border-primary-100 dark:border-primary-800/30">
                                  +{candidate.skills.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-700 shrink-0">
                          {isInvited ? (
                            <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-xs font-semibold border border-accent-200 dark:border-accent-800/30">
                              <CheckCircle2 size={13} />
                              Invited
                            </div>
                          ) : (
                            <button
                              onClick={() => handleInvite(candidate.studentUserId)}
                              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-semibold hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 transition-colors duration-150 cursor-pointer shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
                            >
                              <Send size={12} />
                              Invite to Apply
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
