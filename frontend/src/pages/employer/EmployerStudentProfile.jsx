import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Github,
  MapPin,
  GraduationCap,
  BookOpen,
  Star,
  Calendar,
  Download,
  MessageSquare,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import MatchScoreBadge from '../../components/MatchScoreBadge';
import * as employerAPI from '../../api/employer';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import * as messagesAPI from '../../api/messages';
import { downloadBlobFromResponse } from '../../utils/downloadFile';

const PROFICIENCY_TONE = {
  beginner: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200',
  intermediate: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200',
  advanced: 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-200',
};

function SkillPill({ skill }) {
  const tone = PROFICIENCY_TONE[skill.proficiencyLevel] || PROFICIENCY_TONE.intermediate;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${tone}`}>
      {skill.displayName}
      <span className="text-[10px] opacity-70 capitalize">· {skill.proficiencyLevel}</span>
    </span>
  );
}

export default function EmployerStudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opening, setOpening] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await employerAPI.getApplicantProfile(studentId);
        if (!cancelled) setProfile(res.data.data);
      } catch (err) {
        if (!cancelled) {
          const msg = err.response?.data?.message || 'Failed to load student profile';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProfile();
    return () => { cancelled = true; };
  }, [studentId]);

  async function handleMessage() {
    setOpening(true);
    try {
      const res = await messagesAPI.createConversation({ otherUserId: Number(studentId) });
      const conversationId = res.data.data?.conversationId;
      navigate(conversationId ? `/employer/messages?conversation=${conversationId}` : '/employer/messages');
    } catch {
      toast.error('Could not open conversation. Please try again.');
    } finally {
      setOpening(false);
    }
  }

  async function handleDownloadResume(applicationId) {
    setDownloadingId(applicationId);
    try {
      const res = await employerAPI.downloadResume(applicationId);
      downloadBlobFromResponse(res, `resume-${applicationId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download resume');
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="employer">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout role="employer">
        <div className="max-w-2xl mx-auto py-16 text-center">
          <p className="text-base font-bold text-surface-700 dark:text-surface-300 mb-2">
            {error || 'Student profile not available'}
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
            You can only view profiles of students who applied to your internships or who you invited.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors duration-150"
          >
            <ArrowLeft size={14} /> Go back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const initial = (profile.fullName || '?').charAt(0).toUpperCase();
  const isGraduated = profile.graduationStatus === 'graduated';
  const latestApplication = profile.applications?.[0];

  return (
    <DashboardLayout role="employer">
      <div className="space-y-6">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 font-bold transition-colors duration-150 cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
          <div className="absolute -bottom-16 right-1/4 w-48 h-48 rounded-full bg-accent-400/10 blur-2xl" />

          <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="shrink-0">
              {profile.profilePicture ? (
                <img
                  src={resolveMediaUrl(profile.profilePicture)}
                  alt={profile.fullName}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover ring-4 ring-white/30 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-extrabold shadow-xl ring-4 ring-white/20">
                  {initial}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 flex-wrap mb-2">
                <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  {profile.fullName}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ${
                  isGraduated
                    ? 'bg-accent-400/20 text-accent-100 ring-accent-300/30'
                    : 'bg-white/15 text-white ring-white/30'
                }`}>
                  <GraduationCap size={11} />
                  {isGraduated ? 'Graduated' : 'Enrolled'}
                </span>
              </div>

              <p className="text-primary-100/80 text-sm font-medium">
                {profile.major}
                {profile.university ? ` · ${profile.university}` : ''}
              </p>

              <div className="flex items-center gap-4 flex-wrap mt-3 text-xs text-primary-100/70">
                {profile.gpa != null && (
                  <span className="inline-flex items-center gap-1 font-bold">
                    <Star size={11} className="text-amber-300" fill="currentColor" />
                    GPA {Number(profile.gpa).toFixed(2)}
                  </span>
                )}
                {profile.graduationYear && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={11} />
                    Class of {profile.graduationYear}
                  </span>
                )}
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} />
                    {profile.location}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  onClick={handleMessage}
                  disabled={opening}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary-700 text-sm font-bold hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  {opening ? 'Opening…' : 'Message Student'}
                </button>
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm font-bold border border-white/25 hover:bg-white/25 transition-colors duration-150 cursor-pointer"
                >
                  <Mail size={14} />
                  Email
                </a>
                {latestApplication?.hasResume && (
                  <button
                    onClick={() => handleDownloadResume(latestApplication.applicationId)}
                    disabled={downloadingId === latestApplication.applicationId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm font-bold border border-white/25 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                  >
                    <Download size={14} />
                    {downloadingId === latestApplication.applicationId ? 'Downloading…' : 'Download Resume'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 p-6">
                <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-3">About</h2>
                <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            <div className="rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white">Skills</h2>
                <span className="text-xs font-bold text-surface-500 dark:text-surface-400">
                  {profile.skills.length} total
                </span>
              </div>
              {profile.skills.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  No skills listed yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <SkillPill key={s.skillId} skill={s} />
                  ))}
                </div>
              )}
            </div>

            {/* Applications to your internships */}
            <div className="rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 p-6">
              <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-4">
                Applications to your internships
              </h2>
              {profile.applications.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  This student has not applied to any of your internships yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.applications.map((app) => (
                    <div
                      key={app.applicationId}
                      className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors duration-150"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/employer/internship/${app.internshipId}/applicants`}
                              className="text-sm font-bold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150"
                            >
                              {app.internshipTitle}
                            </Link>
                            <StatusBadge status={app.status} />
                          </div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 inline-flex items-center gap-1">
                            <Calendar size={11} />
                            Applied {new Date(app.appliedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.matchScore != null && (
                            <MatchScoreBadge score={Math.round(Number(app.matchScore))} variant="compact" />
                          )}
                          {app.hasResume && (
                            <button
                              onClick={() => handleDownloadResume(app.applicationId)}
                              disabled={downloadingId === app.applicationId}
                              title="Download resume"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 transition-colors duration-150 cursor-pointer"
                            >
                              {downloadingId === app.applicationId ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {app.coverLetter && (
                        <details className="mt-3 group">
                          <summary className="text-xs font-bold text-primary-600 dark:text-primary-400 cursor-pointer select-none inline-flex items-center gap-1 hover:underline">
                            <FileText size={11} />
                            View cover letter
                          </summary>
                          <p className="mt-2 text-sm text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-line bg-surface-50 dark:bg-surface-800/50 rounded-lg p-3">
                            {app.coverLetter}
                          </p>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 p-6">
              <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-4">Contact</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Mail size={14} className="text-surface-400 mt-0.5 shrink-0" />
                  <a href={`mailto:${profile.email}`} className="text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 break-all">
                    {profile.email}
                  </a>
                </div>
                {profile.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone size={14} className="text-surface-400 mt-0.5 shrink-0" />
                    <a href={`tel:${profile.phone}`} className="text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400">
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profile.linkedinUrl && (
                  <div className="flex items-start gap-2.5">
                    <Linkedin size={14} className="text-surface-400 mt-0.5 shrink-0" />
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 break-all inline-flex items-center gap-1"
                    >
                      LinkedIn <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                {profile.githubUrl && (
                  <div className="flex items-start gap-2.5">
                    <Github size={14} className="text-surface-400 mt-0.5 shrink-0" />
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 break-all inline-flex items-center gap-1"
                    >
                      GitHub <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 p-6">
              <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-4">Education</h2>
              <div className="space-y-3 text-sm">
                {profile.university && (
                  <div className="flex items-start gap-2.5">
                    <BookOpen size={14} className="text-surface-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-surface-700 dark:text-surface-300 font-bold">{profile.university}</p>
                      {profile.major && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{profile.major}</p>
                      )}
                    </div>
                  </div>
                )}
                {profile.graduationYear && (
                  <div className="flex items-start gap-2.5">
                    <GraduationCap size={14} className="text-surface-400 mt-0.5 shrink-0" />
                    <p className="text-surface-700 dark:text-surface-300">
                      Class of <span className="font-bold">{profile.graduationYear}</span>
                    </p>
                  </div>
                )}
                {profile.gpa != null && (
                  <div className="flex items-start gap-2.5">
                    <Star size={14} className="text-amber-400 mt-0.5 shrink-0" fill="currentColor" />
                    <p className="text-surface-700 dark:text-surface-300">
                      GPA <span className="font-bold">{Number(profile.gpa).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
