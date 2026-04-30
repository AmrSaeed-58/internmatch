import { motion } from 'framer-motion';
import { Mail, MessageSquare, Building2, GraduationCap, ShieldCheck } from 'lucide-react';
import LegalShell from '../../components/LegalShell';

const CONTACTS = [
  {
    icon: GraduationCap,
    title: 'Students',
    desc: 'Help with your profile, applications, or matching.',
    email: 'students@internmatch.app',
  },
  {
    icon: Building2,
    title: 'Employers',
    desc: 'Posting issues, applicant questions, billing.',
    email: 'employers@internmatch.app',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy & Legal',
    desc: 'Data requests, account deletion, legal inquiries.',
    email: 'legal@internmatch.app',
  },
  {
    icon: MessageSquare,
    title: 'Press & Partnerships',
    desc: 'Media, integrations, university partnerships.',
    email: 'hello@internmatch.app',
  },
];

export default function ContactPage() {
  return (
    <LegalShell title="Contact Us" eyebrow="We respond within 2 business days">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
          Pick the inbox that matches your question — it'll get to the right
          person faster than the general line.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONTACTS.map(({ icon: Icon, title, desc, email }) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="group p-5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/30 hover:border-primary-300 dark:hover:border-primary-700 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform duration-200">
                <Icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-surface-900 dark:text-white">{title}</h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 mb-2 leading-relaxed">{desc}</p>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 inline-flex items-center gap-1.5">
                <Mail size={13} /> {email}
              </p>
            </a>
          ))}
        </div>
      </motion.div>
    </LegalShell>
  );
}
