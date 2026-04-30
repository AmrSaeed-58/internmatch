import { motion } from 'framer-motion';
import LegalShell from '../../components/LegalShell';

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" eyebrow="Last updated: January 2026">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8 text-surface-600 dark:text-surface-400 leading-relaxed text-sm sm:text-base"
      >
        <p>
          By creating an account on InternMatch you agree to these terms.
          Please read them carefully.
        </p>

        <Section title="Eligibility">
          You must be at least 16 years old (or the age of majority in your
          country, if higher) to use the platform. Students must register with
          accurate information about their education and skills. Employers
          must register on behalf of a real, lawfully operating company.
        </Section>

        <Section title="Acceptable Use">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Don't post discriminatory, illegal, fraudulent, or misleading internship listings.</li>
            <li>Don't impersonate another person or company.</li>
            <li>Don't scrape, redistribute, or resell other users' data.</li>
            <li>Don't attempt to bypass authentication, rate limits, or admin moderation.</li>
            <li>Don't upload malware, illegal content, or anything you don't have rights to.</li>
          </ul>
          <p className="mt-3">Violations result in account suspension or deletion.</p>
        </Section>

        <Section title="Internship Listings">
          Employers are responsible for the accuracy and legality of their
          listings. Listings are reviewed by admins before going live, but
          admin review does not constitute endorsement. Hiring decisions are
          made entirely by the employer.
        </Section>

        <Section title="AI Matching">
          Match scores are estimates derived from skills, profile data, and
          semantic similarity. They are signals — not guarantees of suitability,
          interview success, or employment offers. Use them as one input
          alongside your own judgment.
        </Section>

        <Section title="Account Termination">
          You may delete your account at any time from settings. We may suspend
          or terminate accounts that violate these terms or applicable law.
          Some data (system logs, audit trails) is retained after deletion as
          described in the Privacy Policy.
        </Section>

        <Section title="Disclaimer">
          The platform is provided "as is." We don't warrant that matches will
          result in offers, that listings are vetted beyond admin review, or
          that the service will be uninterrupted. Liability is limited to the
          fullest extent permitted by law.
        </Section>

        <Section title="Changes">
          We may update these terms occasionally. Material changes will be
          announced via email or in-app notification. Continued use after a
          change means you accept the updated terms.
        </Section>

        <Section title="Contact">
          Questions? Email{' '}
          <a href="mailto:legal@internmatch.app" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            legal@internmatch.app
          </a>
          .
        </Section>
      </motion.div>
    </LegalShell>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-surface-900 dark:text-white mb-3">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
