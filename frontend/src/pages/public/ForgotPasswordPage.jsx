import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import API from '../../api/axios';

export default function ForgotPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    if (!email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (apiErr) {
      setError(apiErr.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950 font-body px-4 py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary-500/5 dark:bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent-500/5 dark:bg-accent-500/10 blur-3xl" />
      </div>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-500 dark:text-surface-400 hover:bg-white dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200 hover:shadow-card transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2.5 mb-8 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 rounded-lg animate-fade-in-up relative z-10"
      >
        <img src="/internmatch-logo.png" alt="" className="w-10 h-10 object-contain select-none" draggable={false} />
        <span className="font-heading font-bold text-xl text-surface-900 dark:text-white tracking-tight">
          Intern<span className="text-primary-600 dark:text-primary-400">Match</span>
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-elevated p-8 relative z-10 animate-scale-in">
        {!submitted ? (
          <>
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/30 flex items-center justify-center mb-6 shadow-[0_2px_8px_rgba(124,58,237,0.1)]">
              <KeyRound size={26} className="text-primary-600 dark:text-primary-400" />
            </div>

            {/* Heading */}
            <h1 className="font-heading font-bold text-2xl text-surface-950 dark:text-white tracking-tight mb-2">
              Forgot your password?
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-7">
              No worries. Enter your email address and we'll send you a link to reset your password.
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl mb-5 text-sm text-red-700 dark:text-red-300 animate-scale-in shadow-[0_2px_8px_rgba(239,68,68,0.1)]">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-800/30 flex items-center justify-center shrink-0">
                  <AlertCircle size={14} />
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="group">
                <label htmlFor="fp-email" className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
                    <Mail size={14} className="text-surface-400 dark:text-surface-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                  </div>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`w-full pl-14 pr-4 py-3.5 text-sm bg-surface-50 dark:bg-surface-800/60 border ${
                      error
                        ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30'
                        : 'border-surface-200 dark:border-surface-700 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500'
                    } rounded-xl text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800 group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                  </>
                )}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 rounded group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-4 animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/40 dark:to-accent-800/30 flex items-center justify-center mx-auto mb-5 shadow-[0_4px_12px_rgba(16,185,129,0.15)]">
              <CheckCircle2 size={32} className="text-accent-600 dark:text-accent-400" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-surface-950 dark:text-white tracking-tight mb-3">
              Check your inbox
            </h2>
            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-2">
              If an account exists for{' '}
              <span className="font-semibold text-surface-800 dark:text-surface-100">{email}</span>,
              a password reset link has been sent.
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500 mb-8">
              Didn't receive it? Check your spam folder or try again in a few minutes.
            </p>

            <div className="flex flex-col gap-3 stagger-children">
              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="w-full py-3 px-6 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-semibold text-sm rounded-xl border border-surface-200/80 dark:border-surface-600/50 shadow-card hover:shadow-card-hover transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
              >
                Try a different email
              </button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 w-full py-3 px-6 text-sm font-semibold text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 rounded-xl group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-surface-400 dark:text-surface-500 relative z-10">
        &copy; {new Date().getFullYear()} InternMatch
      </p>
    </div>
  );
}
