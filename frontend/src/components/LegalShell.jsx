import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Shared chrome for static public pages (About, Privacy, Terms, Contact).
// Kept intentionally minimal so each page focuses on its own content.
export default function LegalShell({ title, eyebrow, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-dark-bg text-surface-900 dark:text-white">
      {/* Top bar */}
      <header className="border-b border-surface-200/70 dark:border-surface-800/70 bg-white/70 dark:bg-dark-card/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/internmatch-logo.png" alt="" className="w-9 h-9 object-contain select-none group-hover:scale-105 transition-transform duration-200" draggable={false} />
            <span className="font-heading font-extrabold text-lg tracking-tight">InternMatch</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-xl text-surface-500 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center transition-colors duration-150 cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150"
            >
              <ArrowLeft size={14} /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto px-6 pt-12 pb-8"
      >
        {eyebrow && (
          <p className="inline-block text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">
          {title}
        </h1>
      </motion.section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pb-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200/70 dark:border-surface-800/70 bg-white/40 dark:bg-dark-card/30">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-500 dark:text-surface-400">
          <p>&copy; {new Date().getFullYear()} InternMatch. All rights reserved.</p>
          <div className="flex items-center gap-5 font-semibold">
            <Link to="/about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">About</Link>
            <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">Terms</Link>
            <Link to="/contact" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
