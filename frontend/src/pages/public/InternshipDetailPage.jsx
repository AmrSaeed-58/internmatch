import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  Users,
  Wifi,
  Home,
  X,
  Send,
  FileText,
  Info,
  Briefcase,
  Loader2,
  Sparkles,
  Target,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { getInternship as fetchInternshipAPI } from '../../api/internships';
import { useAuth } from '../../contexts/AuthContext';
import * as studentAPI from '../../api/student';
import * as messagesAPI from '../../api/messages';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const PROF_ORDER = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

function getSkillMatchStatus(requiredSkill, studentSkills) {
  const match = studentSkills.find((s) => s.skillId === requiredSkill.skillId);
  if (!match) return 'missing';
  const studentLevel = PROF_ORDER[match.proficiencyLevel] ?? 0;
  const requiredLevel = PROF_ORDER[requiredSkill.requiredLevel] ?? 0;
  if (studentLevel >= requiredLevel) return 'match';
  return 'partial';
}

const STATUS_CONFIG = {
  match: {
    icon: CheckCircle2,
    label: 'Matched',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/40',
    dot: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
  },
  partial: {
    icon: AlertCircle,
    label: 'Partial',
    chip: 'bg-accent-50 text-accent-700 ring-accent-200/60 dark:bg-accent-900/20 dark:text-accent-300 dark:ring-accent-800/40',
    dot: 'bg-accent-500',
    iconColor: 'text-accent-500',
  },
  missing: {
    icon: XCircle,
    label: 'Missing',
    chip: 'bg-surface-100 text-surface-500 ring-surface-200/60 dark:bg-surface-800 dark:text-surface-400 dark:ring-surface-700/40',
    dot: 'bg-surface-400',
    iconColor: 'text-surface-400',
  },
};

const WORK_TYPE_LABELS = {
  remote: { label: 'Remote', icon: Wifi },
  hybrid: { label: 'Hybrid', icon: Home },
  'on-site': { label: 'On-site', icon: Building2 },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSalary(min, max) {
  if (!min && !max) return null;
  if (min && max) return `$${min}–$${max}/mo`;
  if (min) return `From $${min}/mo`;
  return `Up to $${max}/mo`;
}

function CompanyMark({ name, logo, size = 64 }) {
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
        className="rounded-2xl object-contain bg-white ring-4 ring-white/20 shadow-elevated"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-2xl bg-white flex items-center justify-center font-heading font-bold text-primary-700 ring-4 ring-white/20 shadow-elevated"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function ApplicationModal({ internship, onClose, onApplied, studentProfile }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const profile = studentProfile || {};

  async function handleSubmit() {
    if (!profile.resume) {
      toast.error('Please upload a resume before applying');
      return;
    }
    setSubmitting(true);
    try {
      const { applyToInternship } = await import('../../api/student');
      const res = await applyToInternship({
        internshipId: internship.internshipId,
        coverLetter: coverLetter || undefined,
      });
      toast.success(`Application submitted! Match: ${res.data.data.matchScore ?? 'N/A'}%`);
      onApplied?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-dark-card rounded-3xl border border-surface-200 dark:border-surface-700 shadow-floating w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-700/50">
          <div>
            <h2 className="font-heading font-bold text-surface-900 dark:text-white text-lg tracking-tight">
              Apply Now
            </h2>
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{internship.title} · {internship.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-600 dark:hover:text-surface-300 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-widest mb-2">Resume</p>
            {profile.resume ? (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                    {profile.resume.originalFilename}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    Uploaded {formatDate(profile.resume.createdAt)}
                  </p>
                </div>
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-cta-50 dark:bg-cta-900/15 border border-cta-200/60 dark:border-cta-800/40">
                <div className="w-9 h-9 rounded-xl bg-cta-100 dark:bg-cta-800/30 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} className="text-cta-600 dark:text-cta-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cta-700 dark:text-cta-400">No resume uploaded</p>
                  <Link to="/student/profile" className="text-xs text-cta-600 dark:text-cta-400 underline" onClick={onClose}>
                    Upload your resume first
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-widest mb-2">
              Cover Letter <span className="text-surface-400 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit..."
              rows={5}
              maxLength={5000}
              className="w-full px-3.5 py-3 rounded-2xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-100 text-sm placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors resize-y"
            />
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{coverLetter.length} / 5000 characters</p>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-surface-50 dark:bg-surface-700/30 rounded-2xl border border-surface-100 dark:border-surface-700">
            <Info size={13} className="text-surface-500 dark:text-surface-400 shrink-0 mt-0.5" />
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              By submitting, your profile and resume will be shared with the employer. Your match score at the time of application will be recorded.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!profile.resume || submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 hover:shadow-glow-md disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-[box-shadow] cursor-pointer"
          >
            <Send size={14} />
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ScoreRing({ score, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="font-heading text-3xl font-bold leading-none">{Math.round(score)}</span>
        <span className="text-[10px] uppercase tracking-widest mt-1 opacity-80">match</span>
      </div>
    </div>
  );
}

export default function InternshipDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';

  const backHref =
    user?.role === 'student' ? '/student/internships'
    : user?.role === 'employer' ? '/employer/internships'
    : user?.role === 'admin' ? '/admin/internships'
    : '/';

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentSkillsList, setStudentSkillsList] = useState([]);
  const [openingChat, setOpeningChat] = useState(false);

  async function handleMessageEmployer() {
    if (!isStudent) {
      navigate('/login');
      return;
    }
    if (!internship?.employer?.userId) return;
    setOpeningChat(true);
    try {
      const res = await messagesAPI.createConversation({
        otherUserId: internship.employer.userId,
        internshipId: internship.internshipId,
      });
      const conversationId = res.data.data?.conversationId;
      navigate(conversationId ? `/student/messages?conversation=${conversationId}` : '/student/messages');
    } catch {
      toast.error('Could not open conversation. Please try again.');
    } finally {
      setOpeningChat(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchInternshipAPI(id);
        if (!cancelled) {
          const d = res.data.data;
          setInternship({
            internshipId: d.internshipId,
            title: d.title,
            description: d.description,
            location: d.location,
            durationMonths: d.durationMonths,
            workType: d.workType,
            salaryMin: d.salaryMin,
            salaryMax: d.salaryMax,
            deadline: d.deadline,
            createdAt: d.createdAt,
            status: d.status,
            employer: d.employer,
            companyName: d.employer?.companyName,
            companyLogo: d.employer?.companyLogo,
            industry: d.employer?.industry,
            companySize: d.employer?.companySize,
            companyDescription: d.employer?.companyDescription,
            websiteUrl: d.employer?.websiteUrl,
            employerLocation: d.employer?.location,
            requiredSkills: (d.skills || []).map((s) => ({
              skillId: s.skillId,
              displayName: s.displayName,
              requiredLevel: s.requiredLevel,
              isMandatory: s.isMandatory,
            })),
            matchScore: d.matchScore ?? null,
            skillComparison: d.skillComparison,
            matchBreakdown: d.matchBreakdown,
            applicantCount: d.applicantCount ?? 0,
            isBookmarked: d.isBookmarked ?? false,
            hasApplied: d.hasApplied ?? false,
            applicationStatus: d.applicationStatus,
            isActive: d.isActive,
          });
          setBookmarked(d.isBookmarked ?? false);
        }
      } catch {
        if (!cancelled) setInternship(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!isStudent) return;
    async function loadProfile() {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          studentAPI.getProfile(),
          studentAPI.getSkills(),
        ]);
        setStudentProfile(profileRes.data.data);
        setStudentSkillsList(skillsRes.data.data || []);
      } catch {
        /* noop */
      }
    }
    loadProfile();
  }, [isStudent]);

  async function handleBookmarkToggle() {
    if (!isStudent) {
      navigate('/login', { state: { message: 'Sign in as a student to save internships.' } });
      return;
    }
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    try {
      const { addBookmark, removeBookmark } = await import('../../api/student');
      if (!nextBookmarked) {
        await removeBookmark(internship.internshipId);
        toast.success('Removed from saved');
      } else {
        await addBookmark(internship.internshipId);
        toast.success('Saved to bookmarks');
      }
    } catch (err) {
      setBookmarked(!nextBookmarked);
      toast.error(err.response?.data?.message || 'Could not update saved internships');
    }
  }

  function handleApplyClick() {
    if (!isStudent) {
      navigate('/login', { state: { message: 'Sign in as a student to apply.' } });
      return;
    }
    setShowModal(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-dark-bg flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-dark-bg flex flex-col items-center justify-center gap-4">
        <p className="text-surface-500 dark:text-surface-400 text-lg">Internship not found</p>
        <Link to={backHref} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          Back
        </Link>
      </div>
    );
  }

  const studentSkills = studentSkillsList;
  const salary = formatSalary(internship.salaryMin, internship.salaryMax);
  const WorkIcon = WORK_TYPE_LABELS[internship.workType]?.icon || Building2;
  const workLabel = WORK_TYPE_LABELS[internship.workType]?.label || internship.workType;

  const deadline = internship.deadline ? new Date(internship.deadline) : null;
  const now = new Date();
  const diffDays = deadline ? Math.ceil((deadline - now) / 86400000) : null;
  const isExpired = diffDays !== null && diffDays < 0;

  const skillsWithStatus = internship.skillComparison
    ? internship.skillComparison.map((sc) => ({
        ...sc,
        matchStatus: sc.matched ? (sc.studentLevel ? 'match' : 'missing') : sc.studentLevel ? 'partial' : 'missing',
      }))
    : (internship.requiredSkills || []).map((req) => ({
        ...req,
        matchStatus: getSkillMatchStatus(req, studentSkills),
      }));

  const matchCount = skillsWithStatus.filter((s) => s.matchStatus === 'match').length;
  const partialCount = skillsWithStatus.filter((s) => s.matchStatus === 'partial').length;
  const missingCount = skillsWithStatus.filter((s) => s.matchStatus === 'missing').length;
  const totalSkills = skillsWithStatus.length || 1;

  const breakdown = internship.matchBreakdown || {};
  const skillScore = breakdown.skillScore ?? (internship.matchScore ? internship.matchScore * 0.65 : 0);
  const semanticScore = breakdown.semanticScore ?? (internship.matchScore ? internship.matchScore * 0.20 : 0);
  const profileBonus = breakdown.profileBonus != null ? breakdown.profileBonus * 0.15 : (internship.matchScore ? internship.matchScore * 0.15 : 0);

  const descParagraphs = (internship.description || '').split('\n').filter(Boolean);

  // Anonymous viewers see an enabled "Sign in to apply" CTA that routes to
  // /login. Once signed in, the apply button reflects the real application
  // state. We only disable when the listing is closed/expired/already applied.
  const applyDisabled =
    (user && !isStudent) ||
    (isStudent && (isExpired || internship.isActive === false || internship.hasApplied));
  const applyLabel = !user
    ? 'Sign in to apply'
    : !isStudent
    ? 'Students only'
    : internship.hasApplied
    ? `Applied · ${internship.applicationStatus || 'pending'}`
    : isExpired
    ? 'Deadline passed'
    : internship.isActive === false
    ? 'Not accepting'
    : 'Apply now';

  return (
    <>
      {showModal && (
        <ApplicationModal
          internship={internship}
          onClose={() => setShowModal(false)}
          onApplied={() => {
            setInternship((prev) => prev ? { ...prev, hasApplied: true, applicationStatus: 'pending' } : prev);
          }}
          studentProfile={studentProfile}
        />
      )}

      <div className="min-h-screen bg-surface-50 dark:bg-dark-bg font-body">
        {/* Breadcrumb strip */}
        <div className="sticky top-0 z-20 bg-white/85 dark:bg-dark-card/85 backdrop-blur-lg border-b border-surface-200/60 dark:border-surface-800/60">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate(backHref);
              }}
              className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
              <span>Internships</span>
              <ChevronRight size={12} />
              <span className="text-surface-700 dark:text-surface-300 font-medium truncate max-w-[220px]">{internship.title}</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.25),transparent_55%)]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-accent-400/15 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-primary-400/15 blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-14">
            {(internship.isActive === false || isExpired) && (
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/15 ring-1 ring-accent-300/40 text-accent-200 text-xs font-semibold backdrop-blur-sm">
                <AlertCircle size={12} />
                {internship.isActive === false ? 'This internship is no longer active' : 'Deadline has passed'}
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-end gap-8 lg:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-5">
                  <CompanyMark name={internship.companyName} logo={internship.companyLogo} size={68} />
                  <div className="min-w-0">
                    <p className="text-primary-200/80 text-xs font-semibold uppercase tracking-widest">
                      {internship.industry || 'Internship'}
                    </p>
                    <p className="text-white/95 font-heading font-semibold text-base md:text-lg truncate">
                      {internship.companyName}
                    </p>
                  </div>
                </div>

                <h1 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.05] mb-5 max-w-2xl">
                  {internship.title}
                </h1>

                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: MapPin, text: internship.location },
                    { icon: WorkIcon, text: workLabel },
                    { icon: Clock, text: `${internship.durationMonths} ${internship.durationMonths === 1 ? 'month' : 'months'}` },
                    salary && { icon: DollarSign, text: salary, highlight: true },
                    internship.applicantCount != null && { icon: Users, text: `${internship.applicantCount} applicants` },
                  ].filter(Boolean).map(({ icon: Icon, text, highlight }) => (
                    <span
                      key={text}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ring-1 ${
                        highlight
                          ? 'bg-accent-400/25 text-accent-100 ring-accent-300/40'
                          : 'bg-white/10 text-white ring-white/25'
                      }`}
                    >
                      <Icon size={12} />
                      {text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Match score ring */}
              {internship.matchScore != null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="shrink-0 flex items-center gap-5 self-start lg:self-end"
                >
                  <ScoreRing score={internship.matchScore} size={128} stroke={10} />
                  <div className="text-white max-w-[180px]">
                    <p className="font-heading font-bold text-lg leading-tight">
                      {internship.matchScore >= 80 ? 'Excellent fit' : internship.matchScore >= 60 ? 'Strong fit' : internship.matchScore >= 40 ? 'Partial fit' : 'Low fit'}
                    </p>
                    <p className="text-xs text-primary-100/80 mt-1 leading-relaxed">
                      Based on your skills, profile, and semantic similarity.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="sticky top-14 z-10 bg-white/90 dark:bg-dark-card/90 backdrop-blur-lg border-b border-surface-200/60 dark:border-surface-800/60">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400 min-w-0">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                Posted {formatDate(internship.createdAt)}
              </span>
              {deadline && (
                <span className={`flex items-center gap-1.5 font-semibold ${isExpired ? 'text-surface-400' : diffDays <= 7 ? 'text-cta-600 dark:text-cta-400' : 'text-surface-600 dark:text-surface-300'}`}>
                  <AlertCircle size={12} />
                  {isExpired ? 'Passed' : diffDays <= 7 ? `${diffDays}d left` : `Closes ${formatDate(internship.deadline)}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleBookmarkToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold ring-1 transition-colors cursor-pointer ${
                  bookmarked
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-primary-200 dark:ring-primary-800/50'
                    : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 ring-surface-200 dark:ring-surface-700 hover:ring-primary-300 dark:hover:ring-primary-700'
                }`}
              >
                {bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {bookmarked ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleMessageEmployer}
                disabled={openingChat || !internship?.employer?.userId}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 ring-1 ring-surface-200 dark:ring-surface-700 hover:ring-primary-300 dark:hover:ring-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <MessageSquare size={13} />
                {openingChat ? 'Opening...' : 'Message'}
              </button>
              <button
                onClick={handleApplyClick}
                disabled={applyDisabled}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-primary-600 to-primary-800 text-white hover:shadow-glow-md disabled:opacity-50 disabled:cursor-not-allowed transition-[box-shadow] cursor-pointer"
              >
                <Briefcase size={13} />
                {applyLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* About */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white dark:bg-dark-card rounded-3xl border border-surface-200 dark:border-surface-800 shadow-card p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center ring-1 ring-primary-200/60 dark:ring-primary-800/40">
                    <FileText size={16} />
                  </div>
                  <h2 className="font-heading font-bold text-surface-900 dark:text-white text-lg tracking-tight">
                    About this role
                  </h2>
                </div>
                <div className="max-w-none">
                  {descParagraphs.length === 0 && (
                    <p className="text-sm text-surface-400 italic">No description provided.</p>
                  )}
                  {descParagraphs.map((para, i) =>
                    para.endsWith(':') ? (
                      <h3 key={i} className="font-heading font-semibold text-surface-900 dark:text-white mt-5 mb-2 text-sm">
                        {para}
                      </h3>
                    ) : para.startsWith('- ') ? (
                      <li key={i} className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed ml-5 list-disc">
                        {para.slice(2)}
                      </li>
                    ) : (
                      <p key={i} className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-3">
                        {para}
                      </p>
                    )
                  )}
                </div>
              </motion.section>

              {/* Skills analysis */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="bg-white dark:bg-dark-card rounded-3xl border border-surface-200 dark:border-surface-800 shadow-card p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-5 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 flex items-center justify-center ring-1 ring-accent-200/60 dark:ring-accent-800/40">
                      <Target size={16} />
                    </div>
                    <h2 className="font-heading font-bold text-surface-900 dark:text-white text-lg tracking-tight">
                      Skill alignment
                    </h2>
                  </div>
                  {internship.matchScore != null && (
                    <span className="hidden sm:inline-flex items-center text-xs font-semibold text-surface-500 dark:text-surface-400">
                      {matchCount}/{totalSkills} matched
                    </span>
                  )}
                </div>

                {/* Alignment bar */}
                {internship.matchScore != null && totalSkills > 0 && (
                  <div className="mb-5">
                    <div className="flex h-2 rounded-full overflow-hidden bg-surface-100 dark:bg-surface-800">
                      {matchCount > 0 && <div className="bg-emerald-500" style={{ width: `${(matchCount / totalSkills) * 100}%` }} />}
                      {partialCount > 0 && <div className="bg-accent-500" style={{ width: `${(partialCount / totalSkills) * 100}%` }} />}
                      {missingCount > 0 && <div className="bg-surface-300 dark:bg-surface-700" style={{ width: `${(missingCount / totalSkills) * 100}%` }} />}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-semibold text-surface-500 dark:text-surface-400">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{matchCount} matched</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-500" />{partialCount} partial</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-surface-400" />{missingCount} missing</span>
                    </div>
                  </div>
                )}

                {/* Skill grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {skillsWithStatus.map((skill, idx) => {
                    const cfg = STATUS_CONFIG[skill.matchStatus];
                    const Icon = cfg.icon;
                    const name = skill.skillName || skill.displayName;
                    return (
                      <div
                        key={skill.skillId || idx}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-800/40 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                      >
                        <Icon size={16} className={`shrink-0 ${cfg.iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-surface-900 dark:text-white truncate">{name}</span>
                            {skill.isMandatory && (
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-cta-100 text-cta-700 dark:bg-cta-500/20 dark:text-cta-200 uppercase tracking-wider">
                                Required
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-surface-500 dark:text-surface-400">
                            {skill.requiredLevel}
                          </span>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ring-1 ${cfg.chip}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              {/* Company */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="bg-white dark:bg-dark-card rounded-3xl border border-surface-200 dark:border-surface-800 shadow-card p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center ring-1 ring-surface-200 dark:ring-surface-700">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-surface-900 dark:text-white text-lg tracking-tight">
                      About {internship.companyName}
                    </h2>
                    {isStudent && internship.employer?.userId && (
                      <Link
                        to={`/student/employer/${internship.employer.userId}`}
                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        View company profile
                      </Link>
                    )}
                  </div>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap mb-4">
                  {internship.companyDescription || `A leading company in the ${internship.industry || 'technology'} sector, committed to developing the next generation of talent.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {internship.industry && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 ring-1 ring-surface-200 dark:ring-surface-700">
                      <Briefcase size={11} />{internship.industry}
                    </span>
                  )}
                  {internship.employerLocation && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 ring-1 ring-surface-200 dark:ring-surface-700">
                      <MapPin size={11} />{internship.employerLocation}
                    </span>
                  )}
                  {internship.companySize && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 ring-1 ring-surface-200 dark:ring-surface-700">
                      <Users size={11} />{internship.companySize}
                    </span>
                  )}
                  {internship.websiteUrl && (
                    <a
                      href={internship.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200/60 dark:ring-primary-800/40 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <Globe size={11} />Website
                    </a>
                  )}
                </div>
              </motion.section>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-5">
              {/* Score breakdown */}
              {internship.matchScore != null && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="bg-white dark:bg-dark-card rounded-3xl border border-surface-200 dark:border-surface-800 shadow-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-primary-600 dark:text-primary-400" />
                    <h3 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">
                      Match breakdown
                    </h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'Skills', weight: '65%', value: Math.round(skillScore), max: 65, color: 'from-primary-500 to-primary-700' },
                      { label: 'Semantic', weight: '20%', value: Math.round(semanticScore), max: 20, color: 'from-accent-400 to-accent-600' },
                      { label: 'Profile', weight: '15%', value: Math.round(profileBonus), max: 15, color: 'from-cta-400 to-cta-600' },
                    ].map(({ label, weight, value, max, color }) => (
                      <div key={label}>
                        <div className="flex justify-between items-baseline text-xs mb-1.5">
                          <span className="font-semibold text-surface-700 dark:text-surface-300">
                            {label} <span className="text-surface-400 dark:text-surface-500 font-normal">· {weight}</span>
                          </span>
                          <span className="font-bold text-surface-900 dark:text-white">{value}<span className="text-surface-400 dark:text-surface-500 font-normal">/{max}</span></span>
                        </div>
                        <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${color}`}
                            style={{ width: `${Math.min(100, (value / max) * 100)}%`, transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick facts */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="bg-white dark:bg-dark-card rounded-3xl border border-surface-200 dark:border-surface-800 shadow-card p-6"
              >
                <h3 className="font-heading font-bold text-surface-900 dark:text-white text-sm mb-4 tracking-tight">
                  Quick facts
                </h3>
                <dl className="flex flex-col gap-3">
                  {[
                    { label: 'Industry', value: internship.industry },
                    { label: 'Work type', value: workLabel },
                    { label: 'Duration', value: `${internship.durationMonths} months` },
                    { label: 'Compensation', value: salary || 'Unpaid' },
                    internship.deadline && { label: 'Deadline', value: formatDate(internship.deadline) },
                    internship.applicantCount != null && { label: 'Applicants', value: `${internship.applicantCount}` },
                  ].filter(Boolean).map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                      <dt className="text-surface-500 dark:text-surface-400">{label}</dt>
                      <dd className="font-semibold text-surface-900 dark:text-white text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>

              {/* Apply CTA card (mobile-friendly) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 text-white shadow-elevated"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent-400/20 blur-2xl" />
                <p className="relative text-xs font-semibold uppercase tracking-widest text-primary-200/80 mb-2">Ready to apply?</p>
                <h3 className="relative font-heading font-bold text-lg mb-3 leading-tight">
                  Take the next step toward your career.
                </h3>
                <button
                  onClick={handleApplyClick}
                  disabled={applyDisabled}
                  className="relative w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-primary-800 font-bold text-sm hover:bg-accent-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Briefcase size={14} />
                  {applyLabel}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
