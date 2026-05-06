import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookmarkCheck, Heart, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import InternshipCard from '../../components/InternshipCard';
import EmptyState from '../../components/EmptyState';
import * as studentAPI from '../../api/student';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } };

export default function StudentSaved() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getBookmarks({ limit: 50 });
      setSaved((res.data.data || []).map((item) => ({
        ...item,
        companyName: item.companyName || item.employer?.companyName,
        companyLogo: item.companyLogo || item.employer?.companyLogo,
        industry: item.industry || item.employer?.industry,
      })));
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  async function handleRemove(internshipId) {
    try {
      await studentAPI.removeBookmark(internshipId);
      setSaved((prev) => prev.filter((i) => i.internshipId !== internshipId));
      toast.success('Removed from saved internships');
    } catch {
      toast.error('Failed to remove bookmark');
    }
  }

  return (
    <DashboardLayout role="student">
      {/* Compact header strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex flex-wrap items-end justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center ring-1 ring-primary-200/60 dark:ring-primary-800/40">
            <Heart size={18} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-surface-900 dark:text-white leading-tight">
              Saved Internships
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              {saved.length} bookmarked for quick access
            </p>
          </div>
        </div>
        {saved.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-dark-card ring-1 ring-surface-200 dark:ring-surface-800 shadow-card">
            <BookmarkCheck size={13} className="text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-bold text-surface-700 dark:text-surface-200">{saved.length} saved</span>
          </div>
        )}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary-500" />
        </div>
      ) : saved.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No saved internships"
          message="Browse internships and bookmark the ones you're interested in. They'll appear here for quick access."
          actionLabel="Browse Internships"
          actionTo="/student/internships"
          size="page"
        />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {saved.map((internship) => (
            <motion.div key={internship.internshipId} variants={fadeUp} className="flex flex-col gap-2">
              <InternshipCard
                internship={internship}
                bookmarked
                onBookmarkToggle={(id, isBookmarked) => {
                  if (!isBookmarked) handleRemove(id);
                }}
                showMatchScore
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
