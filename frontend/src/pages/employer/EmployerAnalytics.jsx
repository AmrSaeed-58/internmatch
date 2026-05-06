import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  TrendingUp,
  Target,
  Award,
  Code,
  BarChart2,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import * as employerAPI from '../../api/employer';

const CHART_COLORS = {
  primary: '#7c3aed',
  accent: '#059669',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  red: '#EF4444',
  slate: '#6B7280',
};

const STATUS_COLORS = {
  pending: CHART_COLORS.amber,
  under_review: CHART_COLORS.primary,
  shortlisted: CHART_COLORS.violet,
  interview_scheduled: '#06B6D4',
  accepted: CHART_COLORS.accent,
  rejected: CHART_COLORS.red,
  withdrawn: CHART_COLORS.slate,
};

const STAT_GRADIENT_MAP = {
  primary: 'from-primary-500 to-primary-600',
  accent: 'from-accent-500 to-accent-600',
  amber: 'from-amber-500 to-amber-600',
  violet: 'from-violet-500 to-violet-600',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div
      
      
      className="group bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-surface-800 hover:shadow-card-hover transition-shadow duration-200"
    >
      <div className="relative p-5">
        <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${STAT_GRADIENT_MAP[color]} shadow-lg mb-3`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-3xl font-extrabold font-heading text-surface-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-xs font-bold text-surface-500 dark:text-surface-400 mt-0.5 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 shadow-floating text-sm">
      <p className="font-bold text-surface-800 dark:text-white">{label}</p>
      <p className="text-primary-600 dark:text-primary-400">{payload[0].value} applicants</p>
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 shadow-floating text-sm">
      <p className="font-bold text-surface-800 dark:text-white">{label}</p>
      <p className="text-accent-600 dark:text-accent-400">{payload[0].value} views</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 shadow-floating text-sm">
      <p className="font-bold text-surface-800 dark:text-white">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.color }}>{payload[0].value} applications</p>
    </div>
  );
};

export default function EmployerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await employerAPI.getAnalytics();
        setAnalytics(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="employer">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout role="employer">
        <EmptyState
          icon={BarChart2}
          title="No analytics data"
          message="Analytics will appear once you have internship listings with applicants."
        />
      </DashboardLayout>
    );
  }

  const totalApplicants = analytics.totalApplicants || 0;
  const avgMatchScore = analytics.averageMatchScore || 0;
  const conversionRate = analytics.conversionRate || 0;
  const statusDistribution = (analytics.statusDistribution || []).map((s) => ({
    ...s,
    color: STATUS_COLORS[s.name?.toLowerCase()] || CHART_COLORS.slate,
  }));
  const applicantsPerInternship = analytics.applicantsPerInternship || [];
  const viewsOverTime = analytics.viewsOverTime || [];
  const topSkills = analytics.topSkills || [];

  const acceptedCount = statusDistribution.find((s) => s.name?.toLowerCase() === 'accepted')?.value || 0;
  const acceptanceRate = totalApplicants > 0 ? ((acceptedCount / totalApplicants) * 100).toFixed(1) : '0.0';

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
            <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">PERFORMANCE INSIGHTS</p>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3 inline-flex items-center gap-3">
              <BarChart2 size={26} className="text-primary-300" />
              Analytics
            </h1>
            <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
              Performance insights for your internship listings.
            </p>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard icon={Users} label="Total Applicants" value={totalApplicants} sub="Across all postings" color="primary" />
          <StatCard icon={Target} label="Avg Match Score" value={`${avgMatchScore}%`} sub="AI-calculated score" color="accent" />
          <StatCard icon={TrendingUp} label="Conversion Rate" value={`${conversionRate}%`} sub="View → Application" color="amber" />
          <StatCard icon={Award} label="Acceptance Rate" value={`${acceptanceRate}%`} sub="Accepted / Total" color="violet" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bar chart */}
          <div className="lg:col-span-2 group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative p-5">
              <h2 className="font-heading text-sm font-bold text-surface-900 dark:text-white mb-4 uppercase tracking-wide">
                Applicants per Internship
              </h2>
              {applicantsPerInternship.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={applicantsPerInternship} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
                    <Bar dataKey="applicants" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-surface-400 text-center py-10">No data yet</p>
              )}
            </div>
          </div>

          {/* Pie chart */}
          <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative p-5">
              <h2 className="font-heading text-sm font-bold text-surface-900 dark:text-white mb-4 uppercase tracking-wide">
                Status Distribution
              </h2>
              {statusDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {statusDistribution.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-surface-600 dark:text-surface-400 capitalize">{entry.name?.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-xs font-bold text-surface-700 dark:text-surface-300 tabular-nums">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-surface-400 text-center py-10">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line chart */}
          <div className="lg:col-span-2 group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative p-5">
              <h2 className="font-heading text-sm font-bold text-surface-900 dark:text-white mb-4 uppercase tracking-wide">
                Views Over Time (Weekly)
              </h2>
              {viewsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={viewsOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Line type="monotone" dataKey="views" stroke={CHART_COLORS.accent} strokeWidth={2.5}
                      dot={{ r: 4, fill: CHART_COLORS.accent, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: CHART_COLORS.accent }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-surface-400 text-center py-10">No views data yet</p>
              )}
            </div>
          </div>

          {/* Top Skills */}
          <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
                  <Code size={16} className="text-white" />
                </div>
                <h2 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">Most In-Demand Skills</h2>
              </div>
              <div className="p-5">
                {topSkills.length > 0 ? (
                  <div className="space-y-3">
                    {topSkills.slice(0, 5).map((skill, index) => {
                      const maxCount = topSkills[0]?.count || 1;
                      const width = Math.max(20, Math.round((skill.count / maxCount) * 100));
                      const colors = [
                        'bg-gradient-to-r from-primary-500 to-primary-600',
                        'bg-gradient-to-r from-accent-500 to-accent-600',
                        'bg-gradient-to-r from-amber-500 to-amber-600',
                        'bg-gradient-to-r from-violet-500 to-violet-600',
                        'bg-gradient-to-r from-red-400 to-red-500',
                      ];
                      return (
                        <div key={typeof skill === 'string' ? skill : skill.name || index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-surface-700 dark:text-surface-300">
                              {typeof skill === 'string' ? skill : skill.name || skill.displayName}
                            </span>
                            <span className="text-xs text-surface-400 dark:text-surface-500">#{index + 1}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-[width] duration-700 ease-out ${colors[index] || colors[0]}`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-surface-400 text-center py-10">No skill data yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
