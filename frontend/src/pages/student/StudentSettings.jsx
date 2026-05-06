import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Bell,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Shield,
  Palette,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import * as studentAPI from '../../api/student';

const SECTIONS = [
  { id: 'account', title: 'Account & Security', description: 'Password and login', icon: Lock, color: 'from-primary-500 to-violet-600' },
  { id: 'notifications', title: 'Notifications', description: 'Email alerts', icon: Bell, color: 'from-accent-500 to-orange-500' },
  { id: 'appearance', title: 'Appearance', description: 'Theme and display', icon: Palette, color: 'from-fuchsia-500 to-pink-600' },
  { id: 'danger', title: 'Danger Zone', description: 'Delete account', icon: Shield, color: 'from-red-500 to-rose-600' },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-surface-100 dark:border-surface-800 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-bold text-surface-800 dark:text-surface-200">{label}</p>
        {description && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{description}</p>}
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors cursor-pointer shrink-0 ${
          checked ? 'bg-gradient-to-r from-primary-600 to-primary-700 shadow-glow-sm' : 'bg-surface-200 dark:bg-surface-700'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'}`} />
      </motion.button>
    </div>
  );
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 cursor-pointer"
          tabIndex={-1}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function PanelHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-surface-900 dark:text-white">{title}</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function StudentSettings() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('account');
  const [mobileShowPanel, setMobileShowPanel] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [notifPrefs, setNotifPrefs] = useState({
    applicationStatus: true, recommendations: true, messages: true, invitations: true,
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const res = await studentAPI.getNotificationPreferences();
      const d = res.data.data;
      setNotifPrefs({
        applicationStatus: d.emailApplicationStatus,
        recommendations: d.emailRecommendations,
        messages: d.emailNewMessage,
        invitations: d.emailInvitation,
      });
    } catch {}
  }, []);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  function selectSection(id) {
    setActiveSection(id);
    setMobileShowPanel(true);
  }

  async function handlePasswordChange() {
    if (!passwords.current || !passwords.next || !passwords.confirm) return toast.error('Please fill in all password fields');
    if (passwords.next !== passwords.confirm) return toast.error('New passwords do not match');
    if (passwords.next.length < 8) return toast.error('New password must be at least 8 characters');
    setSavingPassword(true);
    try {
      await studentAPI.changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      toast.success('Password changed. Please log in again.');
      setPasswords({ current: '', next: '', confirm: '' });
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE' || !deletePassword) return;
    try {
      await studentAPI.deleteAccount(deletePassword);
      toast.success('Account deleted');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  }

  async function toggleNotif(key) {
    const newVal = !notifPrefs[key];
    setNotifPrefs((p) => ({ ...p, [key]: newVal }));
    const mapping = {
      applicationStatus: 'emailApplicationStatus', recommendations: 'emailRecommendations',
      messages: 'emailNewMessage', invitations: 'emailInvitation',
    };
    try {
      await studentAPI.updateNotificationPreferences({ [mapping[key]]: newVal });
      toast.success('Saved');
    } catch {
      setNotifPrefs((p) => ({ ...p, [key]: !newVal }));
      toast.error('Failed');
    }
  }

  const current = SECTIONS.find((s) => s.id === activeSection);

  return (
    <DashboardLayout role="student">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">Settings</h1>
        <div className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar nav */}
        <aside className={`${mobileShowPanel ? 'hidden lg:block' : 'block'}`}>
          <div className="lg:sticky lg:top-24 space-y-1.5">
            {SECTIONS.map((section, i) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  onClick={() => selectSection(section.id)}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-accent-50/50 dark:from-primary-900/30 dark:to-accent-900/10 ring-1 ring-primary-200 dark:ring-primary-800/50 shadow-sm'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-sm shrink-0 ${isActive ? '' : 'opacity-80 group-hover:opacity-100'} transition-opacity`}>
                    <Icon size={17} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-surface-800 dark:text-surface-200'}`}>
                      {section.title}
                    </p>
                    <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate">{section.description}</p>
                  </div>
                  <ChevronRight size={15} className={`shrink-0 transition-transform ${isActive ? 'text-primary-500 translate-x-0.5' : 'text-surface-300 dark:text-surface-600'}`} />
                </motion.button>
              );
            })}
          </div>
        </aside>

        {/* Content panel */}
        <div className={`${!mobileShowPanel ? 'hidden lg:block' : 'block'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-dark-card rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-card"
            >
              <button
                onClick={() => setMobileShowPanel(false)}
                className="lg:hidden flex items-center gap-1.5 text-sm font-semibold text-surface-500 mb-4 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>

              {activeSection === 'account' && (
                <>
                  <PanelHeader icon={Lock} color={current.color} title="Account & Security" subtitle="Keep your account secure" />
                  <div className="flex flex-col gap-4 mb-5 max-w-md">
                    <PasswordInput label="Current Password" value={passwords.current} onChange={(v) => setPasswords((p) => ({ ...p, current: v }))} placeholder="Enter current password" />
                    <PasswordInput label="New Password" value={passwords.next} onChange={(v) => setPasswords((p) => ({ ...p, next: v }))} placeholder="Min 8 characters" />
                    <PasswordInput label="Confirm New Password" value={passwords.confirm} onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))} placeholder="Repeat new password" />
                  </div>
                  {passwords.next && passwords.confirm && passwords.next !== passwords.confirm && (
                    <p className="text-xs text-red-600 mb-3 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Passwords do not match
                    </p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePasswordChange}
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 text-white text-sm font-bold cursor-pointer shadow-glow-sm"
                  >
                    <Save size={14} />
                    {savingPassword ? 'Saving...' : 'Update Password'}
                  </motion.button>
                </>
              )}

              {activeSection === 'notifications' && (
                <>
                  <PanelHeader icon={Bell} color={current.color} title="Notifications" subtitle="Choose what emails you receive" />
                  <Toggle checked={notifPrefs.applicationStatus} onChange={() => toggleNotif('applicationStatus')} label="Application Status Updates" description="When your application status changes" />
                  <Toggle checked={notifPrefs.recommendations} onChange={() => toggleNotif('recommendations')} label="New Recommendations" description="AI-matched internship suggestions" />
                  <Toggle checked={notifPrefs.messages} onChange={() => toggleNotif('messages')} label="New Messages" description="When employers send you a message" />
                  <Toggle checked={notifPrefs.invitations} onChange={() => toggleNotif('invitations')} label="Employer Invitations" description="When an employer invites you to apply" />
                </>
              )}

              {activeSection === 'appearance' && (
                <>
                  <PanelHeader icon={Palette} color={current.color} title="Appearance" subtitle="Customize how InternMatch looks" />
                  <div className="grid grid-cols-3 gap-4 max-w-lg">
                    {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                      const selected = theme === value;
                      return (
                        <motion.button
                          key={value}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setTheme(value)}
                          className={`relative flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            selected
                              ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50/50 dark:from-primary-900/30 dark:to-accent-900/10 shadow-glow-sm'
                              : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-white dark:bg-surface-900'
                          }`}
                        >
                          {selected && (
                            <CheckCircle2 size={16} className="absolute top-2 right-2 text-primary-500 fill-primary-100 dark:fill-primary-900" />
                          )}
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            selected ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg' : 'bg-surface-100 dark:bg-surface-800'
                          }`}>
                            <Icon size={20} className={selected ? 'text-white' : 'text-surface-400'} />
                          </div>
                          <span className={`text-xs font-bold ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-surface-600 dark:text-surface-400'}`}>
                            {label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {activeSection === 'danger' && (
                <>
                  <PanelHeader icon={Shield} color={current.color} title="Danger Zone" subtitle="Irreversible account actions" />
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10 border border-red-200 dark:border-red-800/40 mb-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                        Permanently deletes your account and all associated data including applications, messages, and profile information.
                        <strong> This action cannot be undone.</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 mb-3 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wide">
                        Type <span className="text-red-600 font-extrabold">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5 uppercase tracking-wide">
                        Enter your password
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your current password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || !deletePassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete My Account
                  </motion.button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
