import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  Wifi,
  Building2,
  Home,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
  Briefcase,
} from 'lucide-react';
import { resolveMediaUrl } from '../utils/mediaUrl';

const WORK_TYPE_CONFIG = {
  remote: { label: 'Remote', icon: Wifi },
  'on-site': { label: 'On-site', icon: Building2 },
  hybrid: { label: 'Hybrid', icon: Home },
};

const COMPANY_GRADIENTS = [
  'from-primary-600 via-primary-700 to-primary-900',
  'from-primary-500 via-primary-700 to-surface-900',
  'from-accent-500 via-primary-600 to-primary-800',
  'from-primary-700 via-primary-800 to-surface-900',
  'from-cta-500 via-primary-700 to-primary-900',
  'from-primary-400 via-primary-600 to-primary-800',
];

function hashIdx(str, mod) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000;
  return h % mod;
}

function formatSalary(min, max) {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `$${min}-$${max}/mo`;
  if (min != null) return `From $${min}/mo`;
  return `Up to $${max}/mo`;
}

function formatDeadline(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { formatted, diffDays, isUrgent: diffDays >= 0 && diffDays <= 7 };
}

function scoreTone(score) {
  if (score >= 80) return { bg: 'bg-emerald-600', text: 'text-white' };
  if (score >= 60) return { bg: 'bg-primary-800', text: 'text-white' };
  if (score >= 40) return { bg: 'bg-accent-600', text: 'text-white' };
  return { bg: 'bg-surface-700', text: 'text-white' };
}

function CompanyAvatar({ name, logo }) {
  const [broken, setBroken] = useState(false);
  const initials = (name || '??')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const resolved = resolveMediaUrl(logo);

  if (resolved && !broken) {
    return (
      <img
        src={resolved}
        alt={name}
        onError={() => setBroken(true)}
        className="w-14 h-14 rounded-2xl object-contain border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-card"
      />
    );
  }

  return (
    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-primary-700 dark:text-primary-300 text-sm font-heading font-bold shadow-card">
      {initials}
    </div>
  );
}

export default function InternshipCard({
  internship,
  bookmarked: initialBookmarked = false,
  onBookmarkToggle,
  showMatchScore = true,
  detailPath,
  onCalculateMatch,
  calculating = false,
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  useEffect(() => {
    setBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  if (!internship) return null;

  const {
    internshipId,
    title,
    companyName,
    companyLogo,
    location,
    workType,
    durationMonths,
    salaryMin,
    salaryMax,
    deadline,
    matchScore,
    matchAlerts,
    relevanceScore,
    relevanceLabel,
    skills,
  } = internship;

  const topSkills = (skills || []).slice(0, 3);
  const extraSkillCount = (skills || []).length - 3;

  const workTypeCfg = WORK_TYPE_CONFIG[workType] || WORK_TYPE_CONFIG['on-site'];
  const WorkIcon = workTypeCfg.icon;
  const salary = formatSalary(salaryMin, salaryMax);
  const deadlineInfo = deadline ? formatDeadline(deadline) : null;
  const path = detailPath || `/internship/${internshipId}`;

  const gradient = COMPANY_GRADIENTS[hashIdx(companyName || title || '', COMPANY_GRADIENTS.length)];
  const tone = typeof matchScore === 'number' ? scoreTone(matchScore) : null;

  function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    onBookmarkToggle?.(internshipId, next);
  }

  return (
    <Link
      to={path}
      className="group relative flex flex-col bg-white dark:bg-dark-card rounded-3xl border border-surface-200/80 dark:border-surface-800 shadow-card hover:shadow-floating hover:-translate-y-0.5 transition-[transform,box-shadow] duration-300 ease-spring focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg"
    >
      {/* Gradient header */}
      <div className="relative h-24">
        <div className={`absolute inset-0 rounded-t-3xl overflow-hidden bg-gradient-to-br ${gradient}`}>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)',
              backgroundSize: '14px 14px',
            }}
          />
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-8 left-1/3 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        </div>

        {/* Work type pill */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 backdrop-blur-md text-white ring-1 ring-white/30">
          <WorkIcon size={11} />
          {workTypeCfg.label}
        </span>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md ring-1 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white ${
            bookmarked
              ? 'bg-white text-primary-700 ring-white'
              : 'bg-white/15 text-white ring-white/30 hover:bg-white/25'
          }`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </button>

        {/* Match score floating badge */}
        {showMatchScore && typeof matchScore === 'number' && tone && (
          <div className={`absolute -bottom-4 right-4 flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${tone.bg} ${tone.text} shadow-elevated ring-4 ring-white dark:ring-dark-card`}>
            <span className="font-heading text-base font-bold leading-none">{Math.round(matchScore)}</span>
            <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-80">match</span>
          </div>
        )}

        {/* Company avatar floating */}
        <div className="absolute -bottom-6 left-4">
          <CompanyAvatar name={companyName} logo={companyLogo} />
        </div>
      </div>

      {/* Body */}
      <div className="pt-9 px-5 pb-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-heading font-bold text-surface-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-200">
            {title}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400 mt-1 font-medium truncate">
            <Briefcase size={11} className="shrink-0" />
            {companyName}
          </p>
          {typeof relevanceScore === 'number' && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-[11px] font-bold bg-primary-50 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200/70 dark:ring-primary-800/50">
              <Sparkles size={11} />
              {relevanceLabel || 'Relevant'} - {Math.round(relevanceScore)}%
            </span>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          {location && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-surface-50 dark:bg-surface-800/60 text-surface-600 dark:text-surface-300 ring-1 ring-surface-200/60 dark:ring-surface-700/40">
              <MapPin size={10} />
              {location}
            </span>
          )}
          {durationMonths && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-surface-50 dark:bg-surface-800/60 text-surface-600 dark:text-surface-300 ring-1 ring-surface-200/60 dark:ring-surface-700/40">
              <Clock size={10} />
              {durationMonths}mo
            </span>
          )}
          {salary && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 ring-1 ring-accent-200/60 dark:ring-accent-800/40">
              <DollarSign size={10} />
              {salary}
            </span>
          )}
        </div>

        {/* Skills */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topSkills.map((sk) => {
              const levelColor = sk.requiredLevel === 'advanced'
                ? 'bg-cta-500'
                : sk.requiredLevel === 'intermediate'
                ? 'bg-primary-500'
                : 'bg-surface-400';
              return (
                <span
                  key={sk.skillId || sk.displayName}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50/60 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200/50 dark:ring-primary-800/40"
                >
                  <span className={`w-1 h-1 rounded-full ${levelColor}`} />
                  {sk.displayName}
                </span>
              );
            })}
            {extraSkillCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold text-surface-400 dark:text-surface-500">
                +{extraSkillCount} more
              </span>
            )}
          </div>
        )}

        {/* Match alerts (logistics warnings from the matching engine) */}
        {Array.isArray(matchAlerts) && matchAlerts.length > 0 && (
          <div className="flex flex-col gap-1">
            {matchAlerts.map((msg, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-800/40"
              >
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Deadline */}
        {deadlineInfo && (
          <div
            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
              deadlineInfo.diffDays < 0
                ? 'text-surface-400 dark:text-surface-500'
                : deadlineInfo.isUrgent
                ? 'text-cta-600 dark:text-cta-400'
                : 'text-surface-500 dark:text-surface-400'
            }`}
          >
            <AlertCircle size={11} className="shrink-0" />
            {deadlineInfo.diffDays < 0
              ? 'Deadline passed'
              : deadlineInfo.diffDays === 0
              ? 'Due today'
              : deadlineInfo.isUrgent
              ? `${deadlineInfo.diffDays}d left · ${deadlineInfo.formatted}`
              : `Closes ${deadlineInfo.formatted}`}
          </div>
        )}

        {/* Calculate match CTA if unknown */}
        {showMatchScore && matchScore == null && onCalculateMatch && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCalculateMatch(internshipId); }}
            disabled={calculating}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-cta-500 text-white text-[11px] font-bold hover:shadow-glow-sm disabled:opacity-60 transition-all duration-200 cursor-pointer self-start"
          >
            {calculating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {calculating ? 'Calculating…' : 'Calculate Match'}
          </button>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
            View details
          </span>
          <span className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
            <ArrowUpRight size={14} className="group-hover:rotate-12 transition-transform duration-300" />
          </span>
        </div>
      </div>
    </Link>
  );
}
