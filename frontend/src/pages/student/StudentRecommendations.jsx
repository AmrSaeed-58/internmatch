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
  Trophy,
  Crown,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Filter,
  ArrowRight,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Star,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import * as studentAPI from '../../api/student';
import { resolveMediaUrl } from '../../utils/mediaUrl';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CAP_REASON_TEXT = {
  most_mandatory_skills_missing:     'Most of the required skills are missing.',
  majority_mandatory_skills_missing: 'Over half of the required skills are missing.',
  country_mismatch:                  'You are in a different country than this internship.',
};

function pct(score, weight) {
  if (score == null || !weight) return 0;
  return Math.max(0, Math.min(100, Math.round((score / weight) * 100)));
}

function getCompany(rec) {
  return rec.employer || { companyName: rec.companyName, companyLogo: rec.companyLogo };
}

// ---------------------------------------------------------------------------
// ScoreRing — animated circular progress with theme-consistent gradient
// ---------------------------------------------------------------------------
function ScoreRing({ score, size = 140, stroke = 10, light = false }) {
  const value = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const gradId = `ring-grad-${size}-${light ? 'l' : 'd'}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={light ? '#ffffff' : '#7c3aed'} />
            <stop offset="100%" stopColor={light ? '#e0e7ff' : '#a855f7'} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={light ? 'rgba(255,255,255,0.2)' : 'currentColor'}
          className={light ? '' : 'text-surface-100 dark:text-surface-800'}
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
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
        <span className={`font-heading text-3xl font-bold tabular-nums tracking-tight ${light ? 'text-white' : 'text-surface-900 dark:text-white'}`}>
          {value}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${light ? 'text-white/80' : 'text-surface-500 dark:text-surface-400'}`}>
          Match
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BreakdownBar — single horizontal progress row
// ---------------------------------------------------------------------------
function BreakdownBar({ icon: Icon, label, score, weight, light = false }) {
  const value = pct(score, weight);
  const trackBg = light ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-800';
  const fillBg = light
    ? 'bg-gradient-to-r from-white to-white/70'
    : 'bg-gradient-to-r from-primary-500 to-accent-500';
  const labelColor = light ? 'text-white/90' : 'text-surface-600 dark:text-surface-400';
  const valueColor = light ? 'text-white' : 'text-surface-900 dark:text-white';
  const weightColor = light ? 'text-white/60' : 'text-surface-400 dark:text-surface-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={11} className={labelColor} />}
          <span className={`text-[11px] font-bold uppercase tracking-wide ${labelColor}`}>{label}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${valueColor}`}>
          {score == null ? '—' : Math.round(score)}
          <span className={`ml-1 text-[10px] font-semibold ${weightColor}`}>/ {weight}</span>
        </span>
      </div>
      <div className={`h-2 w-full rounded-full ${trackBg} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${fillBg}`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertRow — surfaces matchAlerts (location-related warnings)
// ---------------------------------------------------------------------------
function AlertRow({ alert, light = false }) {
  const wrap = light
    ? 'bg-white/10 border-white/25 text-white'
    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200';
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border ${wrap}`}>
      <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${light ? 'text-amber-200' : 'text-amber-600 dark:text-amber-400'}`} />
      <p className="text-[12px] font-medium leading-snug">{alert}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeaturedMatch — top result hero card (purple/indigo gradient for contrast)
// ---------------------------------------------------------------------------
function FeaturedMatch({ rec }) {
  if (!rec) return null;
  const {
    internshipId,
    title,
    location,
    durationMonths,
    salaryMin,
    salaryMax,
    matchScore,
    matchAlerts = [],
    breakdown = {},
  } = rec;
  const company = getCompany(rec);
  const mandatory = breakdown.mandatory || {};
  const matched = mandatory.matched || [];
  const missing = mandatory.missing || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl mb-8 shadow-floating"
    >
      {/* Dark purple/indigo gradient — strong contrast for white text */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.25),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative p-6 sm:p-8 md:p-10">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
            <Crown size={12} className="text-amber-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Your Top Match</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/10">
            <Trophy size={11} className="text-amber-300" />
            <span className="text-[10px] font-bold text-white">#1</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
          <div className="min-w-0">
            <div className="flex items-start gap-4 mb-5">
              {company.companyLogo ? (
                <img
                  src={resolveMediaUrl(company.companyLogo)}
                  alt={company.companyName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0">
                  <Building2 size={24} className="text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                  {title}
                </h2>
                <p className="text-white/85 text-sm font-semibold mt-1">{company.companyName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {location && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/12 backdrop-blur-sm border border-white/15 text-white text-[11px] font-semibold">
                  <MapPin size={11} />
                  {location}
                </span>
              )}
              {durationMonths && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/12 backdrop-blur-sm border border-white/15 text-white text-[11px] font-semibold">
                  <Clock size={11} />
                  {durationMonths}mo
                </span>
              )}
              {(salaryMin || salaryMax) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/12 backdrop-blur-sm border border-white/15 text-white text-[11px] font-semibold">
                  <DollarSign size={11} />${salaryMin || salaryMax}/mo
                </span>
              )}
            </div>

            {matched.length > 0 && (
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle2 size={14} className="text-emerald-300 shrink-0 mt-0.5" />
                <p className="text-[12px] text-white/90">
                  <span className="font-bold">You bring:</span>{' '}
                  {matched.slice(0, 5).map((s) => s.name).join(', ')}
                  {matched.length > 5 && ` +${matched.length - 5} more`}
                </p>
              </div>
            )}
            {missing.length > 0 && (
              <div className="flex items-start gap-2 mb-2">
                <XCircle size={14} className="text-rose-300 shrink-0 mt-0.5" />
                <p className="text-[12px] text-white/90">
                  <span className="font-bold">You'll learn:</span>{' '}
                  {missing.map((s) => s.name).join(', ')}
                </p>
              </div>
            )}

            {matchAlerts.length > 0 && (
              <div className="mt-4 space-y-2">
                {matchAlerts.map((a, i) => (
                  <AlertRow key={i} alert={a} light />
                ))}
              </div>
            )}

            <Link
              to={`/internship/${internshipId}`}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-white/95 transition-all shadow-lg cursor-pointer"
            >
              View Full Details
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <ScoreRing score={matchScore} size={160} stroke={12} light />
            </div>
            <div className="w-full max-w-[240px] space-y-2.5">
              <BreakdownBar icon={Star} label="Mandatory" score={breakdown.mandatory?.score} weight={breakdown.mandatory?.weight ?? 60} light />
              <BreakdownBar icon={BookOpen} label="Optional" score={breakdown.optional?.score} weight={breakdown.optional?.weight ?? 10} light />
              <BreakdownBar icon={GraduationCap} label="Major" score={breakdown.major?.score} weight={breakdown.major?.weight ?? 10} light />
              <BreakdownBar icon={Target} label="GPA" score={breakdown.gpa?.score} weight={breakdown.gpa?.weight ?? 10} light />
              <BreakdownBar icon={MapPin} label="Location" score={breakdown.location?.score} weight={breakdown.location?.weight ?? 10} light />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// RankedRow — compact list row with expandable 5-signal breakdown
// ---------------------------------------------------------------------------
function RankedRow({ rec, rank }) {
  const [expanded, setExpanded] = useState(false);
  const {
    internshipId,
    title,
    location,
    durationMonths,
    matchScore,
    matchAlerts = [],
    breakdown = {},
  } = rec;
  const company = getCompany(rec);
  const score = Math.round(matchScore ?? 0);

  const scoreColor =
    score >= 80
      ? 'from-emerald-500 to-teal-500'
      : score >= 60
        ? 'from-primary-500 to-violet-500'
        : score >= 40
          ? 'from-amber-500 to-orange-500'
          : 'from-slate-400 to-slate-600';

  const mandatory = breakdown.mandatory || {};
  const matched = mandatory.matched || [];
  const partial = mandatory.partial || [];
  const missing = mandatory.missing || [];
  const skillChips = [
    ...matched.map((s) => ({ ...s, state: 'matched' })),
    ...partial.map((s) => ({ ...s, state: 'partial' })),
    ...missing.map((s) => ({ ...s, state: 'missing' })),
  ].slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.03, 0.3) }}
      className="group relative bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-card-hover transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-12">
          <span className="font-heading text-2xl font-black tracking-tight bg-gradient-to-br from-surface-300 to-surface-400 dark:from-surface-600 dark:to-surface-700 bg-clip-text text-transparent">
            {String(rank).padStart(2, '0')}
          </span>
        </div>

        {company.companyLogo ? (
          <img
            src={resolveMediaUrl(company.companyLogo)}
            alt={company.companyName}
            className="w-12 h-12 rounded-xl object-cover border border-surface-200 dark:border-surface-700 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 shadow-sm">
            <Building2 size={20} className="text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm sm:text-[15px] text-surface-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 font-medium truncate">
            {company.companyName}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-surface-400 dark:text-surface-500">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {location}
              </span>
            )}
            {durationMonths && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {durationMonths}mo
              </span>
            )}
            {matchAlerts.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertTriangle size={10} />
                {matchAlerts.length} alert{matchAlerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div
          className={`hidden md:flex flex-col items-center justify-center shrink-0 w-20 h-16 rounded-xl bg-gradient-to-br ${scoreColor} text-white shadow-lg`}
        >
          <span className="font-heading text-xl font-black tabular-nums">{score}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">Match</span>
        </div>

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
                <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                  Score breakdown (out of 100)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <BreakdownBar icon={Star} label="Mandatory" score={breakdown.mandatory?.score} weight={breakdown.mandatory?.weight ?? 60} />
                <BreakdownBar icon={BookOpen} label="Optional" score={breakdown.optional?.score} weight={breakdown.optional?.weight ?? 10} />
                <BreakdownBar icon={GraduationCap} label="Major" score={breakdown.major?.score} weight={breakdown.major?.weight ?? 10} />
                <BreakdownBar icon={Target} label="GPA" score={breakdown.gpa?.score} weight={breakdown.gpa?.weight ?? 10} />
                <BreakdownBar icon={MapPin} label="Location" score={breakdown.location?.score} weight={breakdown.location?.weight ?? 10} />
              </div>

              {breakdown.bindingCap && (
                <div className="mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40">
                  <AlertTriangle size={12} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                    Score capped at {breakdown.bindingCap.value} (raw: {Math.round(breakdown.rawScore)}) — {CAP_REASON_TEXT[breakdown.bindingCap.reason] || ''}
                  </p>
                </div>
              )}

              {skillChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skillChips.map((s, i) => {
                    const cls =
                      s.state === 'matched'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/50'
                        : s.state === 'partial'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800/50'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800/50';
                    const Icon = s.state === 'missing' ? XCircle : CheckCircle2;
                    return (
                      <span
                        key={`${s.skillId}-${i}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${cls}`}
                      >
                        <Icon size={9} />
                        {s.name}
                      </span>
                    );
                  })}
                </div>
              )}

              {matchAlerts.length > 0 && (
                <div className="space-y-2 mt-3">
                  {matchAlerts.map((a, i) => (
                    <AlertRow key={i} alert={a} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
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

  const featured = useMemo(
    () => (page === 1 && recommendations.length > 0 ? recommendations[0] : null),
    [page, recommendations]
  );
  const rest = useMemo(
    () => (featured ? recommendations.slice(1) : recommendations),
    [featured, recommendations]
  );

  const avgScore =
    recommendations.length > 0
      ? Math.round(recommendations.reduce((s, i) => s + (i.matchScore ?? 0), 0) / recommendations.length)
      : 0;
  const topScore =
    recommendations.length > 0
      ? Math.round(Math.max(...recommendations.map((i) => i.matchScore ?? 0)))
      : 0;

  return (
    <DashboardLayout role="student">
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
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">
              Ranked by skills, major, GPA & location fit
            </p>
          </div>
        </div>

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
                <p className="text-[9px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mt-0.5">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

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
          <span
            className={`font-heading font-bold text-base px-3 py-1 rounded-lg tabular-nums ${
              minScore >= 80
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                : minScore >= 50
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800'
            }`}
          >
            {minScore}%
          </span>
        </div>
      </motion.div>

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
              <RankedRow
                key={rec.internshipId}
                rec={rec}
                rank={featured ? i + 2 : (page - 1) * 20 + i + 1}
              />
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
