import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Target,
  Heart,
  Building2,
  GraduationCap,
  Zap,
} from 'lucide-react';
import LegalShell from '../../components/LegalShell';

export default function AboutPage() {
  return (
    <LegalShell title="About InternMatch" eyebrow="Our Story">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-10"
      >
        <section>
          <p className="text-lg text-surface-700 dark:text-surface-300 leading-relaxed">
            InternMatch is an AI-powered internship matching platform built to
            close the gap between ambitious students and the companies that
            need them. We use semantic matching, skill extraction from resumes,
            and profile signals to surface roles that actually fit — not just
            roles that share a keyword.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-bold text-surface-900 dark:text-white mb-4">Our Mission</h2>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-4">
            Internship hunting is broken. Students apply blindly to dozens of
            postings; employers drown in unqualified resumes. Both sides waste
            weeks on something a good matching system could solve in seconds.
          </p>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
            We're building the matching system. Students upload a resume once,
            and we extract their skills, learn their strengths, and rank
            opportunities by real fit — including what they'd need to add to
            stretch into a role they're almost qualified for.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-bold text-surface-900 dark:text-white mb-5">What We Believe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: BrainCircuit, title: 'AI assists, humans decide', desc: 'Matching scores are signals, not verdicts. The student picks.' },
              { icon: Target, title: 'Match quality > volume', desc: 'Five great matches beats fifty generic ones.' },
              { icon: Heart, title: 'Transparent scoring', desc: 'You see why a role matched and what you could improve.' },
              { icon: Zap, title: 'Speed matters', desc: 'Decisions in seconds, not multi-step wizards.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/30"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-3 shadow-md">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-surface-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-bold text-surface-900 dark:text-white mb-5">Who It's For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-primary-200 dark:border-primary-800/50 bg-gradient-to-br from-primary-50/60 to-transparent dark:from-primary-900/20">
              <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center mb-4 shadow-md">
                <GraduationCap size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-2">Students</h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                Upload your resume, get matched to internships in your sector,
                and see exactly what you'd need to land each role.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-accent-200 dark:border-accent-800/50 bg-gradient-to-br from-accent-50/60 to-transparent dark:from-accent-900/20">
              <div className="w-11 h-11 rounded-xl bg-accent-600 flex items-center justify-center mb-4 shadow-md">
                <Building2 size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-2">Employers</h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                Post a role, let AI extract the required skills from your
                description, and get a ranked list of qualified applicants.
              </p>
            </div>
          </div>
        </section>

        <section className="pt-4">
          <h2 className="font-heading text-2xl font-bold text-surface-900 dark:text-white mb-3">Get In Touch</h2>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
            Questions, feedback, or partnerships?{' '}
            <Link to="/contact" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Reach out here
            </Link>
            .
          </p>
        </section>
      </motion.div>
    </LegalShell>
  );
}
