import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import * as adminAPI from '../../api/admin';

function SectionCard({ icon: Icon, title, gradient, children }) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
      <div className="relative">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-surface-100 dark:border-surface-700">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon size={16} strokeWidth={1.8} className="text-white" />
          </div>
          <h2 className="font-heading font-bold text-surface-900 dark:text-white tracking-tight">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, rightElement, placeholder, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900/50 text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-transparent transition-colors duration-150 pr-10"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {hint && <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  function applyTheme(value) {
    setTheme(value);
    localStorage.setItem('theme', value);
    const root = document.documentElement;
    if (value === 'dark') {
      root.classList.add('dark');
    } else if (value === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    if (!currentPw) { setPwError('Please enter your current password.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('New password and confirmation do not match.'); return; }

    setPwLoading(true);
    try {
      await adminAPI.changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
      });
      toast.success('Password updated successfully. Please log in again.');
      logout();
      navigate('/login');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  }

  function ToggleEye({ show, onToggle }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    );
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <DashboardLayout role="admin">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
        className="mb-8 relative rounded-xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
        <div className="absolute -bottom-16 right-1/4 w-48 h-48 rounded-full bg-accent-400/10 blur-2xl" />
        <div className="relative p-7 md:p-10">
          <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">CONFIGURATION</p>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">Settings</h1>
          <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">Manage your account and preferences.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Change Password */}
        <SectionCard icon={KeyRound} title="Change Password" gradient="from-primary-500 to-primary-600">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <InputField
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              rightElement={<ToggleEye show={showCurrent} onToggle={() => setShowCurrent((p) => !p)} />}
            />
            <InputField
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              hint="Use a mix of letters, numbers, and symbols."
              rightElement={<ToggleEye show={showNew} onToggle={() => setShowNew((p) => !p)} />}
            />
            <InputField
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              rightElement={<ToggleEye show={showConfirm} onToggle={() => setShowConfirm((p) => !p)} />}
            />

            {pwError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={14} className="shrink-0" />
                {pwError}
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-glow-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pwLoading && <Loader2 size={16} className="animate-spin" />}
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </SectionCard>

        {/* Theme */}
        <SectionCard icon={Sun} title="Appearance" gradient="from-amber-500 to-amber-600">
          <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-5 font-medium">
            Choose how InternMatch looks for you. Your preference is saved locally.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <motion.button
                key={value}
                
                onClick={() => applyTheme(value)}
                className={`flex flex-col items-center gap-2.5 py-4 rounded-xl border-2 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  theme === value
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400 shadow-glow-sm'
                    : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50'
                }`}
              >
                <Icon size={22} className={theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'} strokeWidth={1.8} />
                <span className={`text-xs font-bold ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'}`}>
                  {label}
                </span>
                {theme === value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400" />
                )}
              </motion.button>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
