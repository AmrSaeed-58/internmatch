import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  MapPin,
  Filter,
  Loader2,
  Briefcase,
  Wifi,
  Building2,
  Home,
  DollarSign,
  Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import InternshipCard from '../../components/InternshipCard';
import EmptyState from '../../components/EmptyState';
import * as internshipsAPI from '../../api/internships';
import * as studentAPI from '../../api/student';
import { useAuth } from '../../contexts/AuthContext';
import { getCachedScore, saveCachedScore } from '../../utils/calculatedScores';

const WORK_TYPES = [
  { value: 'remote', label: 'Remote', icon: Wifi },
  { value: 'hybrid', label: 'Hybrid', icon: Home },
  { value: 'on-site', label: 'On-site', icon: Building2 },
];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing',
  'Engineering',
  'Business',
  'Design',
  'Other',
];

const DURATION_OPTIONS = [
  { value: '', label: 'Any Duration' },
  { value: '1-3', label: '1–3 months' },
  { value: '3-6', label: '3–6 months' },
  { value: '6-12', label: '6–12 months' },
  { value: '12-24', label: '12–24 months' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'deadline', label: 'Deadline Soon' },
  { value: 'salary', label: 'Highest Salary' },
];

const PAGE_SIZE = 12;

export default function StudentInternships() {
  const { user } = useAuth();
  const studentUserId = user?.userId;

  const [query, setQuery] = useState('');
  const [workType, setWorkType] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [durationRange, setDurationRange] = useState('');
  const [paidOnly, setPaidOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [internships, setInternships] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [calculatingId, setCalculatingId] = useState(null);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const [debouncedLocationFilter, setDebouncedLocationFilter] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocationFilter(locationFilter), 300);
    return () => clearTimeout(timer);
  }, [locationFilter]);

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        sort: debouncedQuery.trim() && sortBy === 'newest' ? 'relevance' : sortBy,
        match_scope: 'industry',
      };
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (workType) params.work_type = workType;
      if (debouncedLocationFilter.trim()) params.location = debouncedLocationFilter.trim();
      if (industryFilter) params.industry = industryFilter;
      if (durationRange) {
        const [min, max] = durationRange.split('-');
        params.duration_min = min;
        params.duration_max = max;
      }
      if (paidOnly) params.paid_only = 'true';

      const res = await internshipsAPI.getInternships(params);
      const { data, pagination } = res.data;

      setInternships(data.map((item) => {
        // For internships outside the student's industry, the API returns
        // matchScore=null. If the student has previously calculated a score
        // for this internship, hydrate it from the local cache so the
        // result persists across refreshes.
        const cached = item.matchScore == null
          ? getCachedScore(studentUserId, item.internshipId)
          : null;
        return {
          internshipId: item.internshipId,
          title: item.title,
          description: item.description,
          companyName: item.employer?.companyName,
          companyLogo: item.employer?.companyLogo,
          industry: item.employer?.industry,
          location: item.location,
          workType: item.workType,
          durationMonths: item.durationMonths,
          salaryMin: item.salaryMin,
          salaryMax: item.salaryMax,
          deadline: item.deadline,
          createdAt: item.createdAt,
          matchScore: item.matchScore ?? cached,
          skills: item.skills,
          relevanceScore: item.relevanceScore,
          relevanceLabel: item.relevanceLabel,
          hasApplied: item.hasApplied,
          applicationStatus: item.applicationStatus,
          isBookmarked: item.isBookmarked,
        };
      }));
      setTotalCount(pagination.total);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      setInternships([]);
      setTotalCount(0);
      setTotalPages(1);
      toast.error(err.response?.data?.message || 'Could not search internships right now');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, workType, debouncedLocationFilter, industryFilter, durationRange, paidOnly, sortBy, studentUserId]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const safePage = Math.min(page, totalPages);

  const hasActiveFilters = workType !== '' || paidOnly || locationFilter !== '' || industryFilter !== '' || durationRange !== '';
  const activeFilterCount = (workType ? 1 : 0) + (paidOnly ? 1 : 0) + (locationFilter ? 1 : 0) + (industryFilter ? 1 : 0) + (durationRange ? 1 : 0);

  function clearFilters() {
    setWorkType('');
    setLocationFilter('');
    setIndustryFilter('');
    setDurationRange('');
    setPaidOnly(false);
    setPage(1);
  }

  async function handleCalculateMatch(internshipId) {
    setCalculatingId(internshipId);
    try {
      const res = await internshipsAPI.getInternship(internshipId);
      const score = res.data.data?.matchScore;
      if (typeof score === 'number') {
        setInternships((prev) => prev.map((it) =>
          it.internshipId === internshipId ? { ...it, matchScore: score } : it
        ));
        saveCachedScore(studentUserId, internshipId, score);
      }
    } catch {
      /* ignore */
    } finally {
      setCalculatingId(null);
    }
  }

  async function handleBookmarkToggle(internshipId, isBookmarked) {
    setInternships((prev) => prev.map((item) =>
      item.internshipId === internshipId ? { ...item, isBookmarked } : item
    ));
    try {
      if (isBookmarked) {
        await studentAPI.addBookmark(internshipId);
        toast.success('Saved to bookmarks');
      } else {
        await studentAPI.removeBookmark(internshipId);
        toast.success('Removed from saved');
      }
    } catch (err) {
      setInternships((prev) => prev.map((item) =>
        item.internshipId === internshipId ? { ...item, isBookmarked: !isBookmarked } : item
      ));
      toast.error(err.response?.data?.message || 'Could not update saved internships');
    }
  }

  return (
    <DashboardLayout role="student">
      {/* Page header with title + sort outside */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Briefcase size={12} />
            Discover Opportunities
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-surface-900 dark:text-white tracking-tight">
            Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-300 dark:to-accent-300">Internship</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 text-sm font-semibold text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer shadow-card"
          >
            {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Search + filter toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-5 flex gap-3"
      >
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Try 'build mobile apps' or 'data analysis in Amman'..."
            className="w-full pl-12 pr-36 py-4 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-900 dark:text-surface-100 text-sm font-medium placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors duration-200 shadow-card"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[10px] font-bold">
            <Sparkles size={11} /> AI POWERED
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowFilters((p) => !p)}
          className={`flex items-center gap-2 px-6 py-4 rounded-2xl border text-sm font-bold transition-all duration-200 cursor-pointer ${
            showFilters || hasActiveFilters
              ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white border-transparent shadow-glow-md'
              : 'bg-white dark:bg-dark-card text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-primary-300 shadow-card'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white/30 text-white text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </motion.button>
      </motion.div>

      {/* Animated Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="relative rounded-2xl overflow-hidden border border-primary-200/60 dark:border-primary-800/40 bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 dark:from-dark-card dark:via-primary-950/20 dark:to-accent-950/10 shadow-card">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-accent-400/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

              <div className="relative p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
                      <Filter size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-surface-900 dark:text-white">Refine Your Search</h3>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Narrow down to find the perfect match</p>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-150 cursor-pointer"
                    >
                      <X size={12} /> Clear all ({activeFilterCount})
                    </motion.button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Work Type - pill selector */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest mb-2">Work Type</p>
                    <div className="flex gap-2 flex-wrap">
                      {WORK_TYPES.map(({ value, label, icon: Icon }) => {
                        const active = workType === value;
                        return (
                          <motion.button
                            key={value}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setWorkType(active ? '' : value); setPage(1); }}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 cursor-pointer ${
                              active
                                ? 'bg-primary-600 text-white border-primary-600 shadow-glow-sm'
                                : 'bg-white dark:bg-dark-card text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-primary-400'
                            }`}
                          >
                            <Icon size={14} />
                            {label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest mb-2">Industry</p>
                    <select
                      value={industryFilter}
                      onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-dark-card text-surface-900 dark:text-surface-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                    >
                      <option value="">All Industries</option>
                      {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest mb-2">Location</p>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        type="text"
                        value={locationFilter}
                        onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                        placeholder="Amman, Remote..."
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-dark-card text-surface-900 dark:text-surface-100 text-sm font-semibold placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest mb-2">Duration</p>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <select
                        value={durationRange}
                        onChange={(e) => { setDurationRange(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-dark-card text-surface-900 dark:text-surface-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                      >
                        {DURATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest mb-2">Compensation</p>
                    <motion.label
                      whileTap={{ scale: 0.98 }}
                      className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        paidOnly
                          ? 'bg-accent-50 dark:bg-accent-900/20 border-accent-500 text-accent-700 dark:text-accent-300'
                          : 'bg-white dark:bg-dark-card border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-accent-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={paidOnly}
                        onChange={(e) => { setPaidOnly(e.target.checked); setPage(1); }}
                        className="sr-only"
                      />
                      <DollarSign size={14} />
                      <span className="text-sm font-bold">Paid internships only</span>
                    </motion.label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results summary + quick clear */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-surface-600 dark:text-surface-400">
          {loading
            ? 'Loading opportunities...'
            : totalCount === 0
            ? 'No internships found'
            : <>Showing <span className="font-bold text-surface-900 dark:text-white">{totalCount}</span> internship{totalCount !== 1 ? 's' : ''}</>}
        </p>
        {hasActiveFilters && !loading && totalCount > 0 && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : internships.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No internships found"
          message={debouncedQuery ? "Try rephrasing your search. Plain English works too." : "Try adjusting your filters to find more opportunities."}
          actionLabel="Clear Filters"
          onAction={() => { setQuery(''); clearFilters(); }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
            {internships.map((internship) => (
              <InternshipCard
                key={internship.internshipId}
                internship={internship}
                showMatchScore
                bookmarked={internship.isBookmarked}
                onBookmarkToggle={handleBookmarkToggle}
                onCalculateMatch={handleCalculateMatch}
                calculating={calculatingId === internship.internshipId}
              />
            ))}
          </div>

          {/* Pagination — windowed: first, …, current±1, …, last */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-600 dark:text-surface-400 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </motion.button>

              {(() => {
                // Build a windowed list: always show 1 and totalPages, plus current±1.
                // Insert null sentinels for ellipses where there are gaps.
                const items = new Set([1, totalPages, safePage, safePage - 1, safePage + 1]);
                const pages = [...items].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
                const out = [];
                for (let i = 0; i < pages.length; i += 1) {
                  if (i > 0 && pages[i] - pages[i - 1] > 1) out.push(null);
                  out.push(pages[i]);
                }
                return out.map((p, idx) =>
                  p === null ? (
                    <span key={`gap-${idx}`} className="w-6 text-center text-surface-400 select-none">…</span>
                  ) : (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors duration-200 cursor-pointer ${
                        p === safePage
                          ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow-sm'
                          : 'border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-600 dark:text-surface-400 hover:border-primary-300'
                      }`}
                    >
                      {p}
                    </motion.button>
                  )
                );
              })()}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card text-surface-600 dark:text-surface-400 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                <ChevronRight size={16} />
              </motion.button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
