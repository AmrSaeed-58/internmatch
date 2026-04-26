import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Users,
  UserCheck,
  Eye,
  Plus,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Calendar,
  MapPin,
  Edit2,
  Sparkles,
  Loader2,
  Building2,
  Rocket,
  Target,
  Star,
  BarChart3,
  Flame,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import * as employerAPI from '../../api/employer';

function StatCard({ icon: Icon, label, value, sub, gradient, to }) {
  const Wrapper = to ? Link : 'div';
  return (
    <Wrapper to={to} className="group block">
      <div className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6 hover:shadow-floating hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-25 transition-opacity duration-300`} />
        <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-4`}>
          <Icon size={24} className="text-white" strokeWidth={2.2} />
        </div>
        <p className="relative text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">{label}</p>
        <p className="relative font-heading font-bold text-3xl text-surface-900 dark:text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && <p className="relative text-xs text-surface-400 dark:text-surface-500 mt-1">{sub}</p>}
      </div>
    </Wrapper>
  );
}

function QuickAction({ to, icon: Icon, label, sub, gradient }) {
  return (
    <Link to={to} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={18} className="text-white" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-surface-900 dark:text-white">{label}</p>
        <p className="text-xs text-surface-500 dark:text-surface-400">{sub}</p>
      </div>
      <ChevronRight size={16} className="text-surface-300 dark:text-surface-600 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
    </Link>
  );
}

function CandidateCard({ candidate }) {
  const score = candidate.matchScore || 0;
  const tone =
    score >= 80
      ? 'from-emerald-500 to-teal-600'
      : score >= 50
      ? 'from-amber-500 to-orange-600'
      : 'from-surface-400 to-surface-500';
  const badgeTone =
    score >= 80
      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
      : score >= 50
      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30'
      : 'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800';

  return (
    <div className="group relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-4 hover:shadow-card-hover hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${tone} opacity-10 group-hover:opacity-25 transition-opacity duration-300`} />
      <div className="relative flex items-center gap-3 mb-3">
        {candidate.profilePicture ? (
          <img src={candidate.profilePicture} alt="" className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-100 dark:ring-emerald-900/40" />
        ) : (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tone} flex items-center justify-center text-white font-heading font-bold shadow-md`}>
            {(candidate.fullName || '?')[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{candidate.fullName}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{candidate.university || 'Student'}</p>
        </div>
      </div>
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-xs text-surface-500 dark:text-surface-400 truncate min-w-0">{candidate.matchedInternship}</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${badgeTone}`}>{score}%</span>
      </div>
    </div>
  );
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [internships, setInternships] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [topCandidates, setTopCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, internshipsRes, analyticsRes] = await Promise.all([
          employerAPI.getProfile(),
          employerAPI.getInternships({ limit: 10 }),
          employerAPI.getAnalytics(),
        ]);
        setProfile(profileRes.data.data);
        setInternships(internshipsRes.data.data);
        setAnalytics(analyticsRes.data.data);

        try {
          const topRes = await employerAPI.getTopCandidates();
          setTopCandidates(topRes.data.data || []);
        } catch {
          // Non-critical
        }
      } catch (err) {
        if (user) {
          setProfile({ companyName: user.companyName || user.fullName });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout role="employer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  const companyName = profile?.companyName || user?.fullName || 'Company';
  const activeInternships = internships.filter((i) => i.status === 'active');
  const overall = analytics?.overall || {};
  const totalViews = internships.reduce((sum, i) => sum + (i.viewCount || 0), 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout role="employer">
      {/* Hero — Hiring Hub */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 p-8 md:p-10 mb-8 shadow-floating"
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-cyan-300/20 blur-3xl translate-y-1/2" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <Flame size={14} className="text-amber-300" />
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">{greeting} · Hiring Hub</span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-2">
              Welcome back, <span className="text-amber-300">{companyName}</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-xl mb-6">
              {activeInternships.length > 0
                ? <>You have <span className="font-bold text-white">{activeInternships.length}</span> active post{activeInternships.length !== 1 ? 's' : ''} drawing in candidates. Let's find your next great hire.</>
                : <>Post your first internship and let our AI surface the perfect candidates for your team.</>}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/employer/internships/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-700 text-sm font-bold hover:bg-amber-50 hover:shadow-lg transition-all duration-200"
              >
                <Plus size={16} />
                Post Internship
              </Link>
              <Link
                to="/employer/candidates"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-bold hover:bg-white/25 transition-all duration-200"
              >
                <Sparkles size={16} />
                AI Candidates
              </Link>
            </div>
          </div>

          {/* Floating illustration */}
          <div className="relative w-48 h-48 shrink-0 hidden md:block">
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-40 h-40 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-2xl rotate-6">
                <Building2 size={72} className="text-white -rotate-12" strokeWidth={1.5} />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 -right-2 w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shadow-xl"
            >
              <Star size={24} className="text-white" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-2 -left-2 w-12 h-12 rounded-2xl bg-cyan-400 flex items-center justify-center shadow-xl"
            >
              <Briefcase size={20} className="text-white" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8"
      >
        <StatCard icon={Briefcase} label="Active Posts" value={activeInternships.length} sub={`${internships.length} total`} gradient="from-emerald-500 to-teal-600" to="/employer/internships" />
        <StatCard icon={Users} label="Total Applicants" value={overall.totalApplicants || 0} sub="Across all posts" gradient="from-cyan-500 to-blue-600" to="/employer/candidates" />
        <StatCard icon={UserCheck} label="Accepted" value={overall.totalAccepted || 0} sub="Hires made" gradient="from-violet-500 to-fuchsia-600" />
        <StatCard icon={Eye} label="Total Views" value={totalViews} sub="Listing impressions" gradient="from-amber-500 to-orange-600" to="/employer/analytics" />
      </motion.div>

      {/* AI Top Candidates */}
      {topCandidates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.13 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white">AI Top Matches</h2>
                <p className="text-xs text-surface-500 dark:text-surface-400">Highest-scoring candidates across your posts</p>
              </div>
            </div>
            <Link to="/employer/candidates" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0">
              Browse all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topCandidates.map((c) => (
              <CandidateCard key={c.studentUserId} candidate={c} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Internship Posts + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Internship Posts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-surface-900 dark:text-white">Your Internship Posts</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Manage listings, applicants, and engagement</p>
            </div>
            <Link to="/employer/internships" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {internships.length === 0 ? (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
                <Rocket size={28} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
              </div>
              <p className="text-base font-bold text-surface-900 dark:text-white mb-1">No internships posted yet</p>
              <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto mb-4">Create your first internship to start receiving AI-matched applications.</p>
              <Link to="/employer/internships/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors duration-150">
                <Plus size={14} /> Post Internship
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {internships.slice(0, 5).map((internship) => (
                <div
                  key={internship.internshipId}
                  className="group bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 hover:shadow-card-hover hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
                      <Briefcase size={20} className="text-white" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-heading font-bold text-surface-900 dark:text-white text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-150">{internship.title}</h3>
                        <StatusBadge status={internship.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400 flex-wrap">
                        <span className="inline-flex items-center gap-1"><MapPin size={12} />{internship.location}</span>
                        {internship.deadline && <span className="inline-flex items-center gap-1"><Calendar size={12} />Deadline {new Date(internship.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 gap-3 flex-wrap">
                    <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Users size={12} className="text-emerald-600 dark:text-emerald-400" />
                        </span>
                        <span className="font-bold text-surface-800 dark:text-surface-200 tabular-nums">{internship.applicantCount}</span> applicants
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-md bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
                          <Eye size={12} className="text-cyan-600 dark:text-cyan-400" />
                        </span>
                        <span className="font-bold text-surface-800 dark:text-surface-200 tabular-nums">{internship.viewCount}</span> views
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/employer/internship/${internship.internshipId}/applicants`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors duration-150">
                        <Users size={12} /> Applicants
                      </Link>
                      <Link to={`/employer/internship/${internship.internshipId}/edit`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700/50 text-surface-700 dark:text-surface-200 text-xs font-bold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150">
                        <Edit2 size={12} /> Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right: Quick Actions + Tip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="flex flex-col gap-6"
        >
          {/* Quick Actions */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
            <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-1">
              <QuickAction to="/employer/internships/new" icon={Plus} label="Post New Internship" sub="Create a new listing" gradient="from-emerald-500 to-teal-600" />
              <QuickAction to="/employer/candidates" icon={Sparkles} label="Browse Candidates" sub="AI-matched talent" gradient="from-violet-500 to-fuchsia-600" />
              <QuickAction to="/employer/analytics" icon={BarChart3} label="View Analytics" sub="Track performance" gradient="from-cyan-500 to-blue-600" />
              <QuickAction to="/employer/internships" icon={Briefcase} label="All Internships" sub="Manage postings" gradient="from-amber-500 to-orange-600" />
            </div>
          </div>

          {/* Tip card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-cyan-300/30 blur-2xl" />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <Target size={20} className="text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-1">Hiring Tip</h3>
              <p className="text-sm text-white/85 leading-relaxed">
                Posts with detailed descriptions and clear required skills get up to <span className="font-bold text-amber-200">3x more qualified applicants</span>. Our AI uses your description to match candidates semantically.
              </p>
            </div>
          </div>

          {/* Conversion mini-card */}
          {(overall.totalApplicants || 0) > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <h3 className="font-heading font-bold text-base text-surface-900 dark:text-white">Conversion</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-500 dark:text-surface-400">Apply rate</span>
                  <span className="font-bold tabular-nums text-surface-900 dark:text-white">
                    {totalViews > 0 ? Math.round(((overall.totalApplicants || 0) / totalViews) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-500 dark:text-surface-400">Accept rate</span>
                  <span className="font-bold tabular-nums text-surface-900 dark:text-white">
                    {(overall.totalApplicants || 0) > 0 ? Math.round(((overall.totalAccepted || 0) / overall.totalApplicants) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
