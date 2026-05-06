import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Users,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../api/axios';

function BrandPanel() {
  const features = [
    'Skill matching that picks up details a keyword search would miss',
    'Resume analysis powered by Gemini',
    'Match scores that show why you fit, not just a number',
    'Real-time messaging with employers',
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between h-full bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-12 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-float" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-400/10 blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
        </svg>
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-2 animate-fade-in-up">
        <img src="/internmatch-logo.png" alt="" className="w-10 h-10 object-contain select-none" draggable={false} />
        <span className="font-heading font-bold text-xl text-white tracking-tight">
          Intern<span className="text-primary-200">Match</span>
        </span>
      </div>

      {/* Hero text */}
      <div className="relative flex-1 flex flex-col justify-center py-12">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-primary-100 text-xs font-semibold mb-6 w-fit animate-fade-in-up border border-white/10">
          <Sparkles size={12} className="animate-pulse-glow" />
          AI-Powered Platform
        </div>
        <h2 className="font-heading font-bold text-4xl xl:text-[2.75rem] text-white tracking-tight leading-[1.1] mb-5 animate-fade-in-up">
          Find internships that actually fit you
        </h2>
        <p className="text-primary-100 leading-relaxed text-base mb-8 max-w-sm animate-fade-in-up">
          Your profile is scored against every internship, so you can spend your time on the ones worth applying to.
        </p>
        <ul className="space-y-3.5 stagger-children">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-primary-100">
              <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={12} className="text-primary-200" />
              </div>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Trust badges instead of stat boxes */}
      <div className="relative flex items-center gap-6 animate-fade-in-up">
        <div className="flex items-center gap-2 text-primary-200 text-sm">
          <Shield size={16} className="text-primary-300" />
          <span>Secure & Private</span>
        </div>
        <div className="flex items-center gap-2 text-primary-200 text-sm">
          <Zap size={16} className="text-primary-300" />
          <span>AI-Powered</span>
        </div>
        <div className="flex items-center gap-2 text-primary-200 text-sm">
          <Users size={16} className="text-primary-300" />
          <span>10,000+ Users</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Success message from register redirect
  const successMsg = location.state?.message || '';

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/login', {
        email: form.email,
        password: form.password,
        rememberMe: form.remember,
      });
      const { token, user } = res.data.data;
      login(token, user);
      const role = user.role;
      navigate(`/${role}/dashboard`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-body bg-white dark:bg-surface-950">
      {/* Left branding panel */}
      <div className="lg:w-[52%] xl:w-[55%]">
        <BrandPanel />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Back</span>
          </Link>
          <Link to="/" className="lg:hidden flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            <img src="/internmatch-logo.png" alt="" className="w-9 h-9 object-contain select-none" draggable={false} />
            <span className="font-heading font-bold text-lg text-surface-900 dark:text-white tracking-tight">
              Intern<span className="text-primary-600 dark:text-primary-400">Match</span>
            </span>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-16 py-8">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-heading font-bold text-3xl text-surface-950 dark:text-white tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm leading-relaxed">
                Sign in to access your personalized internship matches.
              </p>
            </div>

            {/* Success message */}
            {successMsg && (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/50 rounded-xl mb-6 text-sm text-accent-700 dark:text-accent-300 animate-scale-in shadow-[0_2px_8px_rgba(16,185,129,0.1)]">
                <div className="w-7 h-7 rounded-lg bg-accent-100 dark:bg-accent-800/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                {successMsg}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl mb-6 text-sm text-red-700 dark:text-red-300 animate-scale-in shadow-[0_2px_8px_rgba(239,68,68,0.1)]">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-800/30 flex items-center justify-center shrink-0">
                  <AlertCircle size={14} />
                </div>
                {error}
              </div>
            )}

            {/* Form with border */}
            <div className="border border-surface-200 dark:border-surface-700 rounded-2xl p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email */}
                <div className="group">
                  <label htmlFor="login-email" className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
                      <Mail size={14} className="text-surface-400 dark:text-surface-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                    </div>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-14 pr-4 py-3.5 text-sm bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500 transition-colors duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-sm font-semibold text-surface-700 dark:text-surface-200">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 rounded"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
                      <Lock size={14} className="text-surface-400 dark:text-surface-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
                    </div>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full pl-14 pr-12 py-3.5 text-sm bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500 transition-colors duration-200"
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
                </div>

                {/* Remember me - just bold "Remember me" */}
                <div className="flex items-center gap-2.5">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    checked={form.remember}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500/30 bg-surface-50 dark:bg-surface-800 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-sm font-bold text-surface-700 dark:text-surface-200 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950 group"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200 dark:border-surface-700/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white dark:bg-surface-950 text-xs text-surface-400 dark:text-surface-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-surface-50 dark:bg-surface-800/60 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200 font-semibold text-sm rounded-xl border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 shadow-card hover:shadow-card-hover transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
            >
              Create a free account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center text-xs text-surface-400 dark:text-surface-500">
          &copy; {new Date().getFullYear()} InternMatch &middot;{' '}
          <Link to="/privacy" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors duration-200 cursor-pointer">Privacy</Link> &middot;{' '}
          <Link to="/terms" className="hover:text-surface-600 dark:hover:text-surface-300 transition-colors duration-200 cursor-pointer">Terms</Link>
        </div>
      </div>
    </div>
  );
}
