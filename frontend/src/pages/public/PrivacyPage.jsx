import { motion } from 'framer-motion';
import LegalShell from '../../components/LegalShell';

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" eyebrow="Last updated: January 2026">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="prose-sm sm:prose dark:prose-invert max-w-none space-y-8"
      >
        <p className="text-base text-surface-600 dark:text-surface-300 leading-relaxed">
          InternMatch respects your privacy. This policy explains what we
          collect, how we use it, and the choices you have. We keep this short
          on purpose — if anything is unclear, contact us.
        </p>

        <Section title="What We Collect">
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Account info:</strong> name, email, password (hashed), role.</li>
            <li><strong>Student profile:</strong> university, major, graduation year, GPA, bio, location, links, resume.</li>
            <li><strong>Resume content:</strong> we extract text and skills to power matching.</li>
            <li><strong>Employer profile:</strong> company name, industry, description, logo, contact info.</li>
            <li><strong>Activity:</strong> applications, bookmarks, messages, internship views.</li>
          </ul>
        </Section>

        <Section title="How We Use It">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Match students to internships based on skills, profile, and semantic similarity.</li>
            <li>Show employers a ranked list of qualified applicants for their roles.</li>
            <li>Send notifications about applications, messages, and recommendations (email preferences are configurable in settings).</li>
            <li>Operate, secure, and improve the platform.</li>
          </ul>
        </Section>

        <Section title="Who Sees Your Data">
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Other users:</strong> employers see your profile and resume only when you apply to one of their internships.</li>
            <li><strong>Admins:</strong> our admin team can access account data to operate the platform and resolve disputes.</li>
            <li><strong>Third parties:</strong> we use Google Gemini for skill extraction and embeddings; only resume text and job descriptions are sent, never identifiers like email or name.</li>
          </ul>
          <p className="mt-3">We do not sell personal data.</p>
        </Section>

        <Section title="Your Choices">
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Edit or delete:</strong> update your profile or remove individual fields anytime.</li>
            <li><strong>Email preferences:</strong> control which notifications email you in account settings.</li>
            <li><strong>Account deletion:</strong> delete your account permanently from settings. Resumes, applications, and messages are removed; system logs are retained for audit purposes.</li>
          </ul>
        </Section>

        <Section title="Security">
          <p>
            Passwords are hashed (bcrypt). Sessions use signed JWTs that
            invalidate on password change. Uploads are validated by type and
            size. We do our best, but no platform is bulletproof — please
            choose a strong, unique password.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about your data? Email{' '}
            <a href="mailto:privacy@internmatch.app" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              privacy@internmatch.app
            </a>
            {' '}and we'll respond within 7 days.
          </p>
        </Section>
      </motion.div>
    </LegalShell>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-surface-900 dark:text-white mb-3">{title}</h2>
      <div className="text-surface-600 dark:text-surface-400 leading-relaxed text-sm sm:text-base">{children}</div>
    </section>
  );
}
