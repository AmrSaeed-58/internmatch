import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Bookmark,
  TrendingUp,
  ArrowRight,
  Sparkles,
  FileText,
  User,
  ChevronRight,
  Loader2,
  Zap,
  Target,
  Rocket,
  Trophy,
  Award,
  Flame,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import * as studentAPI from '../../api/student';
import { useAuth } from '../../contexts/AuthContext';
import { computeProfileStrength } from '../../utils/profileStrength';

function StatCard({ icon: Icon, label, value, sub, gradient, to }) {
  const Wrapper = to ? Link : 'div';
  return (
    <Wrapper to={to} className="group block">
      <div className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6 hover:shadow-floating hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-4`}>
          <Icon size={24} className="text-white" strokeWidth={2.2} />
        </div>
        <p className="text-sm font-semibold text-surface-500 dark:text-surface-400 mb-1">{label}</p>
        <p className="font-heading font-bold text-3xl text-surface-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{sub}</p>
      </div>
    </Wrapper>
  );
}

function CircularProgress({ strength }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (strength / 100) * circumference;
  const color = strength >= 80 ? '#10b981' : strength >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} className="stroke-surface-200 dark:stroke-surface-800" strokeWidth="10" fill="none" />
        <motion.circle
          cx="64" cy="64" r={radius}
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading font-bold text-3xl text-surface-900 dark:text-white tabular-nums">{strength}%</span>
        <span className="text-[11px] font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Complete</span>
      </div>
    </div>
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
      <ChevronRight size={16} className="text-surface-300 dark:text-surface-600 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
    </Link>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [topRecs, setTopRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          studentAPI.getProfile(),
          studentAPI.getSkills(),
        ]);
        setProfile(profileRes.data.data);
        setSkills(skillsRes.data.data);

        try {
          const recsRes = await studentAPI.getRecommendations({ page: 1, limit: 5 });
          setTopRecs(recsRes.data.data || []);
        } catch { /* ignore */ }
      } catch (err) {
        if (user) {
          setProfile({
            fullName: user.fullName,
            email: user.email,
            university: user.university || '',
            major: user.major || '',
            graduationYear: user.graduationYear,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const displayName = profile?.fullName || user?.fullName || 'Student';
  const profileStrength = profile ? computeProfileStrength(profile, skills) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout role="student">
      {/* Hero Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-8 md:p-10 mb-8 shadow-floating"
      >
        {/* Decorative gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-accent-400/20 blur-3xl translate-y-1/2" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-4">
              <Flame size={14} className="text-amber-300" />
              <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">{greeting}</span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-2">
              Welcome back, <span className="text-amber-300">{displayName.split(' ')[0]}</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-xl mb-6">
              Ready to find your next opportunity? Your dream internship is just a click away.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/student/internships"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-primary-700 text-sm font-bold hover:bg-amber-50 hover:shadow-lg transition-all duration-200"
              >
                <Briefcase size={16} />
                Browse Internships
              </Link>
              <Link
                to="/student/recommendations"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-bold hover:bg-white/25 transition-all duration-200"
              >
                <Sparkles size={16} />
                AI Picks
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
                <Rocket size={72} className="text-white -rotate-12" strokeWidth={1.5} />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 -right-2 w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shadow-xl"
            >
              <Trophy size={24} className="text-white" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-2 -left-2 w-12 h-12 rounded-2xl bg-accent-400 flex items-center justify-center shadow-xl"
            >
              <Zap size={20} className="text-white" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8"
      >
        <StatCard icon={FileText} label="Applications" value={0} sub="Start applying today" gradient="from-blue-500 to-blue-700" to="/student/applications" />
        <StatCard icon={Bookmark} label="Saved" value={0} sub="Bookmark favorites" gradient="from-pink-500 to-rose-600" to="/student/saved" />
        <StatCard icon={TrendingUp} label="Skills" value={skills.length} sub={skills.length === 0 ? 'Add your skills' : 'Keep growing'} gradient="from-amber-500 to-orange-600" to="/student/profile" />
        <StatCard icon={Award} label="Profile" value={`${profileStrength}%`} sub="Complete your profile" gradient="from-primary-500 to-accent-600" to="/student/profile" />
      </motion.div>

      {/* Profile Strength + Recommendations + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: Profile Strength + Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="xl:col-span-2 flex flex-col gap-6"
        >
          {/* Profile Strength Card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <CircularProgress strength={profileStrength} />
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-xl text-surface-900 dark:text-white mb-2">Profile Strength</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                  A complete profile gets up to <span className="font-bold text-primary-600 dark:text-primary-300">3x more matches</span>. Add more details to unlock better opportunities.
                </p>
                <Link
                  to="/student/profile"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors duration-150 group/link"
                >
                  Complete Profile
                  <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform duration-150" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-bold text-xl text-surface-900 dark:text-white">Recommended For You</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">AI-matched internships based on your profile</p>
              </div>
              <Link to="/student/recommendations" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 shrink-0">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {topRecs.length > 0 ? (
              <div className="flex flex-col gap-3">
                {topRecs.map((rec) => (
                  <Link
                    key={rec.internshipId}
                    to={`/internship/${rec.internshipId}`}
                    className="group block bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-5 hover:shadow-card-hover hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-md shrink-0">
                        <Briefcase size={20} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-surface-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-150">{rec.title}</p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 truncate">{rec.employer?.companyName}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                          rec.matchScore >= 80
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                            : rec.matchScore >= 50
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30'
                            : 'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800'
                        }`}>{rec.matchScore}%</div>
                        <ChevronRight size={18} className="text-surface-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-150" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center mx-auto mb-4">
                  <Rocket size={28} className="text-primary-600 dark:text-primary-400" strokeWidth={1.8} />
                </div>
                <p className="text-base font-bold text-surface-900 dark:text-white mb-1">No recommendations yet</p>
                <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto mb-4">
                  Add skills and upload your resume to receive AI-powered matches.
                </p>
                <Link
                  to="/student/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors duration-150"
                >
                  <User size={14} /> Complete Profile
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column: Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col gap-6"
        >
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
            <h2 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-1">
              <QuickAction to="/student/internships" icon={Briefcase} label="Browse Internships" sub="Find new opportunities" gradient="from-blue-500 to-blue-700" />
              <QuickAction to="/student/applications" icon={Target} label="Track Applications" sub="Monitor your progress" gradient="from-teal-500 to-teal-700" />
              <QuickAction to="/student/saved" icon={Bookmark} label="Saved Jobs" sub="Your bookmarked list" gradient="from-pink-500 to-rose-600" />
              <QuickAction to="/student/profile" icon={User} label="Update Profile" sub="Boost your match score" gradient="from-primary-500 to-accent-600" />
            </div>
          </div>

          {/* Tip Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-1">Pro Tip</h3>
              <p className="text-sm text-white/85 leading-relaxed">
                Upload your resume and let our AI extract your skills automatically. It takes less than 30 seconds!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
