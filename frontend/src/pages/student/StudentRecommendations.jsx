import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Zap,
  Target,
  Loader2,
  Brain,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  Flame,
  ArrowRight,
  Filter,
  Crown,
  MapPin,
  Clock,
  DollarSign,
  Building2,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import * as studentAPI from '../../api/student';

function ScoreRing({ score, size = 140, stroke = 10 }) {
  const pct = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const hue = pct >= 80 ? '#10b981' : pct >= 60 ? '#7c3aed' : pct >= 40 ? '#f59e0b' : '#64748b';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={hue} />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-surface-100 dark:text-surface-800" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#grad-${size})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-bold tracking-tight text-surface-900 dark:text-white">{pct}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">Match</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, color }) {
  const pct = value == null ? 0 : Math.min(100, Math.round(value));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400">{label}</span>
        <span className="text-xs font-bold text-surface-900 dark:text-white tabular-nums">
          {value == null ? 'N/A' : `${Math.round(value)}%`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function FeaturedMatch({ rec }) {
  if (!rec) return null;
  const {
    internshipId,
    title,
    companyName,
    companyLogo,
    location,
    durationMonths,
    salaryMin,
    salaryMax,
    matchScore,
    breakdown = {},
    skillComparison = [],
    semanticInsight,
    improvementTip,
  } = rec;

  const matched = skillComparison.filter((s) => s.matched);
  const missing = skillComparison.filter((s) => s.isMandatory && !s.matched);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl mb-8 shadow-floating"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.3),transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

      <div className="relative p-6 sm:p-8 md:p-10">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <Crown size={12} className="text-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Your Top Match</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm">
            <Flame size={11} className="text-amber-200" />
            <span className="text-[10px] font-bold text-white">#1</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
          <div className="min-w-0">
            <div className="flex items-start gap-4 mb-5">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
                  <Building2 size={24} className="text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">{title}</h2>
                <p className="text-white/80 text-sm font-semibold mt-1">{companyName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {location && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold">
                  <MapPin size={11} />{location}
                </span>
              )}
              {durationMonths && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold">
                  <Clock size={11} />{durationMonths}mo
                </span>
              )}
              {(salaryMin || salaryMax) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm text-white text-[11px] font-semibold">
                  <DollarSign size={11} />${salaryMin || salaryMax}/mo
                </span>
              )}
            </div>

            {semanticInsight && (
              <p className="text-sm text-white/90 leading-relaxed mb-4 italic max-w-xl">"{semanticInsight}"</p>
            )}

            {matched.length > 0 && (
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle2 size={14} className="text-green-200 shrink-0 mt-0.5" />
                <p className="text-[12px] text-white/90">
                  <span className="font-bold">You bring:</span> {matched.slice(0, 4).map((s) => s.skillName).join(', ')}
                  {matched.length > 4 && ` +${matched.length - 4} more`}
                </p>
              </div>
            )}
            {missing.length > 0 && (
              <div className="flex items-start gap-2">
                <XCircle size={14} className="text-rose-200 shrink-0 mt-0.5" />
                <p className="text-[12px] text-white/90">
                  <span className="font-bold">You'll learn:</span> {missing.map((s) => s.skillName).join(', ')}
                </p>
              </div>
            )}

            {improvementTip && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
                <Lightbulb size={13} className="text-amber-200 shrink-0 mt-0.5" />
                <p className="text-[12px] text-white/90 font-medium">{improvementTip}</p>
              </div>
            )}

            <Link
              to={`/internship/${internshipId}`}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-orange-600 text-sm font-bold hover:bg-white/90 transition-all shadow-lg cursor-pointer"
            >
              View Full Details
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <ScoreRing score={matchScore} size={160} stroke={12} />
            </div>
            <div className="w-full max-w-[220px] space-y-2.5">
              <BreakdownBar label="Skill" value={breakdown.skillScore} color="linear-gradient(90deg, #ffffff, #fef3c7)" />
              <BreakdownBar label="Semantic" value={breakdown.semanticScore} color="linear-gradient(90deg, #ffffff, #fed7aa)" />
              <BreakdownBar label="Profile" value={breakdown.profileBonus} color="linear-gradient(90deg, #ffffff, #fecaca)" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RankedRow({ rec, rank }) {
  const [expanded, setExpanded] = useState(false);
  const {
    internshipId,
    title,
    companyName,
    companyLogo,
    location,
    durationMonths,
    matchScore,
    breakdown = {},
    skillComparison = [],
    semanticInsight,
  } = rec;

  const score = Math.round(matchScore ?? 0);
  const scoreColor =
    score >= 80 ? 'from-emerald-500 to-teal-500'
    : score >= 60 ? 'from-primary-500 to-violet-500'
    : score >= 40 ? 'from-amber-500 to-orange-500'
    : 'from-slate-400 to-slate-600';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.03, 0.3) }}
      className="group relative bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-card-hover transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4 sm:p-5">
        {/* Rank number */}
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-12">
          <span className="font-heading text-2xl font-black tracking-tight bg-gradient-to-br from-surface-300 to-surface-400 dark:from-surface-600 dark:to-surface-700 bg-clip-text text-transparent">
            {String(rank).padStart(2, '0')}
          </span>
        </div>

        {/* Logo */}
        {companyLogo ? (
          <img src={companyLogo} alt={companyName} className="w-12 h-12 rounded-xl object-cover border border-surface-200 dark:border-surface-700 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 shadow-sm">
            <Building2 size={20} className="text-white" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm sm:text-[15px] text-surface-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium truncate">{companyName}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-surface-400 dark:text-surface-500">
            {location && <span className="flex items-center gap-1"><MapPin size={10} />{location}</span>}
            {durationMonths && <span className="flex items-center gap-1"><Clock size={10} />{durationMonths}mo</span>}
          </div>
        </div>

        {/* Score pill */}
        <div className={`hidden md:flex flex-col items-center justify-center shrink-0 w-20 h-16 rounded-xl bg-gradient-to-br ${scoreColor} text-white shadow-lg`}>
          <span className="font-heading text-xl font-black tabular-nums">{score}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">Match</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
          >
            {expanded ? 'Hide' : 'Why?'}
          </button>
          <Link
            to={`/internship/${internshipId}`}
            className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold text-center transition-colors cursor-pointer"
          >
            View
          </Link>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-surface-100 dark:border-surface-800 bg-gradient-to-br from-primary-50/40 to-accent-50/20 dark:from-primary-900/10 dark:to-accent-900/5">
              <div className="flex items-center gap-2 mb-3 pt-3">
                <Brain size={14} className="text-primary-600 dark:text-primary-400" />
                <span className="text-xs font-bold text-surface-800 dark:text-surface-200">Match breakdown</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <BreakdownBar label="Skill" value={breakdown.skillScore} color="linear-gradient(90deg, #7c3aed, #a855f7)" />
                <BreakdownBar label="Semantic" value={breakdown.semanticScore} color="linear-gradient(90deg, #10b981, #06b6d4)" />
                <BreakdownBar label="Profile" value={breakdown.profileBonus} color="linear-gradient(90deg, #f59e0b, #f97316)" />
              </div>
              {skillComparison.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skillComparison.slice(0, 8).map((s, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        s.matched
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/50'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800/50'
                      }`}
                    >
                      {s.matched ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                      {s.skillName}
                    </span>
                  ))}
                </div>
              )}
              {semanticInsight && (
                <p className="mt-3 text-[11px] text-surface-600 dark:text-surface-400 italic">{semanticInsight}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StudentRecommendations() {
  const [minScore, setMinScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await studentAPI.getRecommendations({ page, limit: 20, minScore });
      setRecommendations(data.data);
      setTotalCount(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setRecommendations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, minScore]);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);
  useEffect(() => { setPage(1); }, [minScore]);

  const featured = useMemo(() => page === 1 && recommendations.length > 0 ? recommendations[0] : null, [page, recommendations]);
  const rest = useMemo(() => featured ? recommendations.slice(1) : recommendations, [featured, recommendations]);

  const avgScore = recommendations.length > 0
    ? Math.round(recommendations.reduce((s, i) => s + (i.matchScore ?? 0), 0) / recommendations.length)
    : 0;
  const topScore = recommendations.length > 0
    ? Math.round(Math.max(...recommendations.map((i) => i.matchScore ?? 0)))
    : 0;

  return (
    <DashboardLayout role="student">
      {/* Compact header strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-violet-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
                Your Top Matches
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[9px] font-black uppercase tracking-wider">
                AI
              </span>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">
              Ranked by hybrid skill + semantic scoring
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-2">
          {[
            { label: 'Total', value: totalCount, icon: Target, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
            { label: 'Top', value: `${topScore}%`, icon: Trophy, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Avg', value: `${avgScore}%`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bg}`}>
              <Icon size={14} className={color} />
              <div>
                <p className={`font-heading font-bold text-sm leading-none ${color}`}>{value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Score filter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-surface-500 dark:text-surface-400" />
            <span className="text-sm font-bold text-surface-800 dark:text-surface-200">Min score</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary-600"
              style={{ background: `linear-gradient(to right, #7c3aed ${minScore}%, #e2e8f0 ${minScore}%)` }}
            />
          </div>
          <span className={`font-heading font-bold text-base px-3 py-1 rounded-lg tabular-nums ${
            minScore >= 80
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
              : minScore >= 50
              ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20'
              : 'text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800'
          }`}>
            {minScore}%
          </span>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary-500" />
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No matches above threshold"
          message="Lower the minimum score slider to see more recommendations, or update your profile to improve matches."
          actionLabel="Reset Filter"
          onAction={() => setMinScore(0)}
        />
      ) : (
        <>
          {featured && <FeaturedMatch rec={featured} />}

          {rest.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Zap size={15} className="text-primary-500" />
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-surface-600 dark:text-surface-400">
                More matches for you
              </h2>
              <div className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
            </div>
          )}

          <div className="space-y-3">
            {rest.map((rec, i) => (
              <RankedRow key={rec.internshipId} rec={rec} rank={featured ? i + 2 : (page - 1) * 20 + i + 1} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-surface-500 dark:text-surface-400 font-medium px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
