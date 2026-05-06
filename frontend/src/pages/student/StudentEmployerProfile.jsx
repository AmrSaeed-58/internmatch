import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Users,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import InternshipCard from '../../components/InternshipCard';
import * as internshipsAPI from '../../api/internships';
import * as studentAPI from '../../api/student';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function StudentEmployerProfile() {
  const { employerId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await internshipsAPI.getEmployerProfile(employerId);
        if (!cancelled) setProfile(res.data.data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Failed to load employer profile');
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [employerId]);

  async function handleBookmarkToggle(internshipId, isBookmarked) {
    setProfile((prev) => prev ? {
      ...prev,
      internships: prev.internships.map((item) =>
        item.internshipId === internshipId ? { ...item, isBookmarked } : item
      ),
    } : prev);
    try {
      if (isBookmarked) {
        await studentAPI.addBookmark(internshipId);
        toast.success('Saved to bookmarks');
      } else {
        await studentAPI.removeBookmark(internshipId);
        toast.success('Removed from saved');
      }
    } catch (err) {
      setProfile((prev) => prev ? {
        ...prev,
        internships: prev.internships.map((item) =>
          item.internshipId === internshipId ? { ...item, isBookmarked: !isBookmarked } : item
        ),
      } : prev);
      toast.error(err.response?.data?.message || 'Could not update saved internships');
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role="student">
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-4">Employer profile not available.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold"
          >
            <ArrowLeft size={14} /> Go back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const logo = resolveMediaUrl(profile.companyLogo);
  const initial = (profile.companyName || '?').charAt(0).toUpperCase();

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 font-bold transition-colors duration-150 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <section className="relative rounded-2xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6">
            <div className="shrink-0">
              {logo ? (
                <img src={logo} alt={profile.companyName} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-contain bg-white ring-4 ring-white/30 shadow-xl" />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white/15 flex items-center justify-center text-white text-4xl font-extrabold ring-4 ring-white/20">
                  {initial}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {profile.companyName}
              </h1>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-primary-100/80">
                {profile.industry && <span className="inline-flex items-center gap-1"><Building2 size={12} /> {profile.industry}</span>}
                {profile.companySize && <span className="inline-flex items-center gap-1"><Users size={12} /> {profile.companySize}</span>}
                {profile.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary-700 text-sm font-bold">
                    <Globe size={14} /> Website <ExternalLink size={11} />
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 text-white border border-white/25 text-sm font-bold">
                    <Linkedin size={14} /> LinkedIn <ExternalLink size={11} />
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 text-white border border-white/25 text-sm font-bold">
                    <Mail size={14} /> Contact
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-3">About</h2>
          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-line">
            {profile.companyDescription || 'No company description has been added yet.'}
          </p>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-surface-900 dark:text-white">Open internships</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">{profile.internships.length} active posting{profile.internships.length === 1 ? '' : 's'}</p>
            </div>
            <Link to="/student/internships" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
              Browse all
            </Link>
          </div>
          {profile.internships.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 p-8 text-center text-sm text-surface-500 dark:text-surface-400">
              This employer has no active internships right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {profile.internships.map((internship) => (
                <InternshipCard
                  key={internship.internshipId}
                  internship={{
                    ...internship,
                    companyName: internship.companyName || internship.employer?.companyName,
                    companyLogo: internship.companyLogo || internship.employer?.companyLogo,
                  }}
                  bookmarked={internship.isBookmarked}
                  onBookmarkToggle={handleBookmarkToggle}
                  showMatchScore
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
