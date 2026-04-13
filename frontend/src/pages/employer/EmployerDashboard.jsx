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
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import * as employerAPI from '../../api/employer';

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  const Wrapper = to ? Link : 'div';
  return (
    <Wrapper to={to} className="group block">
      <div className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 p-5 hover:shadow-card-hover transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
            <Icon size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium text-surface-500 dark:text-surface-400">{label}</span>
        </div>
        <p className="font-heading font-bold text-2xl text-surface-900 dark:text-white tabular-nums">{value}</p>
        {sub && <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{sub}</p>}
      </div>
    </Wrapper>
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

        // Fetch top candidates (non-critical)
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
          <Loader2 size={28} className="animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const companyName = profile?.companyName || user?.fullName || 'Company';
  const activeInternships = internships.filter((i) => i.status === 'active');
  const overall = analytics?.overall || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout role="employer">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">{greeting}</p>
            <h1 className="font-heading font-bold text-2xl text-surface-900 dark:text-white tracking-tight">
              Welcome back, {companyName}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {activeInternships.length > 0
                ? `You have ${activeInternships.length} active internship${activeInternships.length !== 1 ? 's' : ''} posted.`
                : 'Post your first internship to start receiving applications.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/employer/internships/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors duration-150"
            >
              <Plus size={14} />
              Post Internship
            </Link>
            <Link
              to="/employer/candidates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150"
            >
              <Sparkles size={14} />
              AI Candidates
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard icon={Briefcase} label="Active Posts" value={activeInternships.length} sub={`${internships.length} total`} color="bg-primary-600" to="/employer/internships" />
        <StatCard icon={Users} label="Total Applicants" value={overall.totalApplicants || 0} sub="Across all posts" color="bg-accent-600" to="/employer/candidates" />
        <StatCard icon={UserCheck} label="Accepted" value={overall.totalAccepted || 0} sub="Applications accepted" color="bg-primary-800" />
        <StatCard icon={Eye} label="Total Views" value={internships.reduce((sum, i) => sum + (i.viewCount || 0), 0)} sub="Listing views" color="bg-cta-500" to="/employer/analytics" />
      </motion.div>

      {/* AI Top Matches */}
      {topCandidates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-sm text-surface-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary-500" /> AI Top Matches
            </h2>
            <Link to="/employer/candidates" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline inline-flex items-center gap-1">
              Browse all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {topCandidates.map((c) => (
              <div key={c.studentUserId} className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 p-4">
                <div className="flex items-center gap-3 mb-2">
                  {c.profilePicture ? (
                    <img src={c.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                      {(c.fullName || '?')[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{c.fullName}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{c.university || 'Student'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{c.matchedInternship}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ml-2 ${
                    c.matchScore >= 80
                      ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20'
                      : c.matchScore >= 50
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800'
                  }`}>{c.matchScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Internship Posts */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-sm text-surface-900 dark:text-white">Your Internship Posts</h2>
              <Link to="/employer/internships" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline inline-flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {internships.length === 0 ? (
              <div className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 p-10 text-center">
                <Briefcase size={24} className="text-surface-300 dark:text-surface-600 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">No internships posted yet</p>
                <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Create your first internship to start receiving applications.</p>
                <Link to="/employer/internships/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors duration-150">
                  <Plus size={14} /> Post Internship
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {internships.slice(0, 5).map((internship) => (
                  <div
                    key={internship.internshipId}
                    className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 hover:shadow-card-hover transition-shadow duration-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-semibold text-surface-900 dark:text-white text-sm truncate">{internship.title}</h3>
                          <StatusBadge status={internship.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-surface-500 dark:text-surface-400">
                          <span className="inline-flex items-center gap-1"><MapPin size={11} />{internship.location}</span>
                          {internship.deadline && <span className="inline-flex items-center gap-1"><Calendar size={11} />Deadline: {new Date(internship.deadline).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
                        <span className="inline-flex items-center gap-1"><Users size={12} className="text-primary-500" /><span className="font-semibold text-surface-700 dark:text-surface-300">{internship.applicantCount}</span> applicants</span>
                        <span className="inline-flex items-center gap-1"><Eye size={12} className="text-accent-500" /><span className="font-semibold text-surface-700 dark:text-surface-300">{internship.viewCount}</span> views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/employer/internship/${internship.internshipId}/applicants`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors duration-150">
                          <Users size={12} /> View Applicants
                        </Link>
                        <Link to={`/employer/internship/${internship.internshipId}/edit`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-300 text-xs font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-150">
                          <Edit2 size={12} /> Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 p-5 h-fit">
            <h2 className="font-heading font-semibold text-surface-900 dark:text-white text-sm mb-3">Quick Actions</h2>
            <div className="flex flex-col">
              {[
                { label: 'Post New Internship', desc: 'Create a new listing', icon: Plus, to: '/employer/internships/new' },
                { label: 'Browse Candidates', desc: 'AI-matched talent', icon: Sparkles, to: '/employer/candidates' },
                { label: 'View Analytics', desc: 'Track performance', icon: TrendingUp, to: '/employer/analytics' },
                { label: 'All Internships', desc: 'Manage postings', icon: Briefcase, to: '/employer/internships' },
              ].map((action) => (
                <Link key={action.label} to={action.to} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150">
                  <action.icon size={16} className="text-surface-400 dark:text-surface-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-100">{action.label}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{action.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-surface-300 dark:text-surface-600 group-hover:text-primary-600 transition-colors duration-150 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
