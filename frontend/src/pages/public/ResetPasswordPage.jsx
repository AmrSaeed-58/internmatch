import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import API from '../../api/axios';

function Requirement({ met, label }) {
  return (
    <li className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${met ? 'text-accent-600 dark:text-accent-400' : 'text-surface-400 dark:text-surface-500'}`}>
      {met ? (
        <div className="w-5 h-5 rounded-md bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
          <CheckCircle2 size={12} className="text-accent-500" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-md bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0">
          <XCircle size={12} className="text-surface-300 dark:text-surface-600" />
        </div>
      )}
      {label}
    </li>
  );
}

function StrengthBar({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    password.length >= 12,
  ];
  const score = checks.filter(Boolean).length;
  const config = [
    { label: 'Too short', color: 'bg-red-400' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-primary-500' },
    { label: 'Strong', color: 'bg-accent-500' },
  ];
  const current = config[score];

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? current.color : 'bg-surface-200 dark:bg-surface-700'
            }`}
          />
        ))}
      </div>
      {password && (
        <span className={`text-xs font-medium ${
          score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-primary-500' : 'text-accent-600 dark:text-accent-400'
        }`}>
          {current.label}
        </span>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const { theme, toggleTheme } = useTheme();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const requirements = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: '1 uppercase letter (A-Z)', met: /[A-Z]/.test(form.password) },
    { label: '1 number (0-9)', met: /\d/.test(form.password) },
    { label: 'Passwords match', met: form.password.length > 0 && form.password === form.confirmPassword },
  ];

  const allMet = requirements.every((r) => r.met);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.password) errs.password = 'New password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include at least 1 uppercase letter.';
    else if (!/\d/.test(form.password)) errs.password = 'Must include at least 1 number.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!resetToken) {
      setApiError('Missing reset token. Please use the link from your email.');
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      await API.post('/auth/reset-password', {
        token: resetToken,
        newPassword: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login', {
        state: { message: 'Password reset successfully. Sign in with your new password.' },
      }), 2000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950 font-body px-4 py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-primary-500/5 dark:bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 rounded-full bg-accent-500/5 dark:bg-accent-500/10 blur-3xl" />
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
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow-sm">
          <BrainCircuit size={20} className="text-white" />
        </div>
        <span className="font-heading font-bold text-xl text-surface-900 dark:text-white tracking-tight">
          Intern<span className="text-primary-600 dark:text-primary-400">Match</span>
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-elevated p-8 relative z-10 animate-scale-in">
        {!success ? (
          <>
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/30 flex items-center justify-center mb-6 shadow-[0_2px_8px_rgba(124,58,237,0.1)]">
              <ShieldCheck size={26} className="text-primary-600 dark:text-primary-400" />
            </div>

            {/* Heading */}
            <h1 className="font-heading font-bold text-2xl text-surface-950 dark:text-white tracking-tight mb-2">
              Reset your password
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-7">
              Choose a strong new password for your account. You'll be redirected to sign in once it's set.
            </p>

            {apiError && (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl mb-5 text-sm text-red-700 dark:text-red-300 animate-scale-in shadow-[0_2px_8px_rgba(239,68,68,0.1)]">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-800/30 flex items-center justify-center shrink-0">
                  <AlertCircle size={14} />
                </div>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* New password */}
              <div className="group">
                <label htmlFor="rp-password" className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                  New password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
                    <Lock size={14} className="text-surface-400 dark:text-surface-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                  </div>
                  <input
                    id="rp-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    className={`w-full pl-14 pr-12 py-3.5 text-sm bg-surface-50 dark:bg-surface-800/60 border ${
                      errors.password
                        ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30'
                        : 'border-surface-200 dark:border-surface-700 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500'
                    } rounded-xl text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600 dark:text-red-400">
                    <XCircle size={11} />{errors.password}
                  </p>
                )}
                {/* Strength bar */}
                {form.password && <StrengthBar password={form.password} />}
              </div>

              {/* Confirm password */}
              <div className="group">
                <label htmlFor="rp-confirm" className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                  Confirm new password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
                    <Lock size={14} className="text-surface-400 dark:text-surface-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                  </div>
                  <input
                    id="rp-confirm"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    className={`w-full pl-14 pr-12 py-3.5 text-sm bg-surface-50 dark:bg-surface-800/60 border ${
                      errors.confirmPassword
                        ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30'
                        : form.confirmPassword && form.password === form.confirmPassword
                        ? 'border-accent-400 dark:border-accent-600 focus:ring-accent-500/30'
                        : 'border-surface-200 dark:border-surface-700 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500'
                    } rounded-xl text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
                    aria-label={showConfirm ? 'Hide' : 'Show'}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600 dark:text-red-400">
                    <XCircle size={11} />{errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Requirements checklist */}
              <div className="bg-surface-50 dark:bg-surface-800/40 rounded-xl p-4 border border-surface-100 dark:border-surface-700/50">
                <p className="text-xs font-semibold text-surface-600 dark:text-surface-300 mb-3 uppercase tracking-wide">
                  Password requirements
                </p>
                <ul className="space-y-2.5 stagger-children">
                  {requirements.map((req) => (
                    <Requirement key={req.label} met={req.met} label={req.label} />
                  ))}
                </ul>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !allMet}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-800"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Resetting password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* Back link */}
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
              Password reset!
            </h2>
            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-6">
              Your password has been updated successfully. Redirecting you to sign in...
            </p>
            {/* Progress indicator */}
            <div className="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-1.5 mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-accent-400 to-accent-500 h-1.5 rounded-full animate-[grow_2s_linear_forwards]" style={{ width: '0%' }} />
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
            >
              Go to sign in
            </Link>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-surface-400 dark:text-surface-500 relative z-10">
        &copy; {new Date().getFullYear()} InternMatch
      </p>

      <style>{`
        @keyframes grow {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
