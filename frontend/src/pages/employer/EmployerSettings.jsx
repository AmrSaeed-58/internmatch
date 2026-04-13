import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Bell,
  Sun,
  Moon,
  Monitor,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import * as employerAPI from '../../api/employer';

const TABS = [
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'account', label: 'Account', icon: Shield },
];

const NOTIFICATION_PREFS = [
  { key: 'emailNewApplication', label: 'New Applications Received', description: 'When a student applies to your internship' },
  { key: 'emailInternshipApproved', label: 'Internship Approved / Rejected', description: 'When admin approves or rejects your internship posting' },
  { key: 'emailNewMessage', label: 'New Messages', description: 'When you receive a new message from a student' },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 cursor-pointer shrink-0 ${
        checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
      }`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function EmployerSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('password');

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    emailNewApplication: true,
    emailInternshipApproved: true,
    emailNewMessage: true,
  });

  // Theme
  const [theme, setTheme] = useState('system');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Load notification preferences
  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await employerAPI.getNotificationPreferences();
        setNotifPrefs(res.data.data);
      } catch (err) {
        // defaults are fine
      }
    }
    loadPrefs();
  }, []);

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-600 transition-colors duration-150';
  const labelClass =
    'block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1.5 tracking-wide uppercase';

  function handlePwChange(e) {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
    setPwErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handlePwSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!pwForm.current) errors.current = 'Enter your current password';
    if (pwForm.next.length < 8) errors.next = 'Password must be at least 8 characters';
    if (pwForm.next !== pwForm.confirm) errors.confirm = 'Passwords do not match';
    if (Object.keys(errors).length > 0) { setPwErrors(errors); return; }

    setPwSaving(true);
    try {
      await employerAPI.changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      toast.success('Password updated. Please log in again.');
      logout();
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  }

  const toggleNotif = useCallback(async (key) => {
    const newVal = !notifPrefs[key];
    setNotifPrefs((prev) => ({ ...prev, [key]: newVal }));
    try {
      await employerAPI.updateNotificationPreferences({ [key]: newVal });
    } catch (err) {
      setNotifPrefs((prev) => ({ ...prev, [key]: !newVal }));
      toast.error('Failed to update preference');
    }
  }, [notifPrefs]);

  async function handleDeleteAccount() {
    if (!deletePassword) { toast.error('Enter your password'); return; }
    try {
      await employerAPI.deleteAccount(deletePassword);
      toast.success('Account deleted');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  }

  return (
    <DashboardLayout role="employer">
      <div className="space-y-6">
        {/* Header Banner */}
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
            <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">ACCOUNT MANAGEMENT</p>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">Settings</h1>
            <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
              Manage your account preferences and security settings.
            </p>
          </div>
        </motion.div>

        <div className="flex gap-6 flex-col md:flex-row">
          {/* Tab list */}
          <div className="md:w-48 shrink-0">
            <nav className="flex md:flex-col gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 text-left ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
                  }`}
                >
                  <tab.icon size={15} className="shrink-0" />
                  <span className="hidden md:block">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="flex-1">
            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="group relative rounded-xl overflow-hidden animate-fade-in-up bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
                <div className="relative">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
                    <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
                      <Lock size={16} className="text-white" />
                    </div>
                    <h2 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">Change Password</h2>
                  </div>
                  <div className="p-5">
                    <form onSubmit={handlePwSubmit} className="space-y-4">
                      {[
                        { name: 'current', label: 'Current Password' },
                        { name: 'next', label: 'New Password' },
                        { name: 'confirm', label: 'Confirm New Password' },
                      ].map(({ name, label }) => (
                        <div key={name}>
                          <label className={labelClass}>{label}</label>
                          <div className="relative">
                            <input
                              type={showPw[name] ? 'text' : 'password'}
                              name={name}
                              value={pwForm[name]}
                              onChange={handlePwChange}
                              className={`${inputClass} pr-10 ${pwErrors[name] ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((prev) => ({ ...prev, [name]: !prev[name] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors duration-150 cursor-pointer"
                            >
                              {showPw[name] ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {pwErrors[name] && <p className="text-xs text-red-500 mt-1">{pwErrors[name]}</p>}
                        </div>
                      ))}

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={pwSaving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 transition-colors duration-150 cursor-pointer shadow-glow-sm"
                        >
                          <Lock size={14} />
                          {pwSaving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="group relative rounded-xl overflow-hidden animate-fade-in-up bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
                <div className="relative">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
                    <div className="w-9 h-9 rounded-xl bg-primary-800 flex items-center justify-center shadow-sm">
                      <Bell size={16} className="text-white" />
                    </div>
                    <h2 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">Notification Preferences</h2>
                  </div>
                  <div className="p-5">
                    <div className="divide-y divide-surface-100 dark:divide-surface-700/40">
                      {NOTIFICATION_PREFS.map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between py-4 gap-4">
                          <div>
                            <p className="text-sm font-bold text-surface-800 dark:text-surface-200">{pref.label}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{pref.description}</p>
                          </div>
                          <Toggle
                            checked={notifPrefs[pref.key]}
                            onChange={() => toggleNotif(pref.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="group relative rounded-xl overflow-hidden animate-fade-in-up bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
                <div className="relative">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
                    <div className="w-9 h-9 rounded-xl bg-accent-600 flex items-center justify-center shadow-sm">
                      <Sun size={16} className="text-white" />
                    </div>
                    <h2 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">Appearance</h2>
                  </div>
                  <div className="p-5">
                    <p className={labelClass}>Theme</p>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {[
                        { value: 'light', label: 'Light', Icon: Sun },
                        { value: 'dark', label: 'Dark', Icon: Moon },
                        { value: 'system', label: 'System', Icon: Monitor },
                      ].map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTheme(value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors duration-150 cursor-pointer ${
                            theme === value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-xs font-bold">{label}</span>
                          {theme === value && <CheckCircle2 size={13} className="text-primary-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
                  <div className="relative">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
                      <div className="w-9 h-9 rounded-xl bg-accent-600 flex items-center justify-center shadow-sm">
                        <Shield size={16} className="text-white" />
                      </div>
                      <h2 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">Account Information</h2>
                    </div>
                    <div className="p-5">
                      <dl className="space-y-3">
                        {[
                          { label: 'Full Name', value: user?.fullName },
                          { label: 'Email', value: user?.email },
                          { label: 'Company', value: user?.companyName },
                          { label: 'Role', value: 'Employer' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800/60 last:border-0">
                            <dt className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wide">{label}</dt>
                            <dd className="text-sm text-surface-800 dark:text-surface-200 font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
                  <div className="relative">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                        <Trash2 size={16} className="text-white" />
                      </div>
                      <h2 className="font-heading font-bold text-red-600 dark:text-red-400 text-sm tracking-tight">Danger Zone</h2>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                        Once you delete your account, all data including internships and messages will be permanently removed.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-150 cursor-pointer"
                      >
                        <Trash2 size={15} />
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white dark:bg-surface-900 rounded-xl p-6 max-w-md w-full shadow-floating border border-surface-200 dark:border-surface-700 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <h3 className="font-heading text-lg font-extrabold text-surface-900 dark:text-white tracking-tight">Delete Account?</h3>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed mb-4">
              Enter your password to confirm account deletion. This action is permanent.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={inputClass}
              placeholder="Enter your password"
            />
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
