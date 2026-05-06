import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
  User,
  MapPin,
  Upload,
  Save,
  Eye,
  ChevronDown,
  Camera,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import * as employerAPI from '../../api/employer';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Engineering', 'Marketing', 'Other',
];

const COMPANY_SIZES = ['1-50', '51-200', '201-500', '500+'];

function SectionCard({ icon: Icon, gradient, title, children }) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
      <div className="relative">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon size={16} className="text-white" />
          </div>
          <h2 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">{title}</h2>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function EmployerProfile() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const logoInputRef = useRef(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await employerAPI.getProfile();
        const d = res.data.data;
        setForm({
          companyName: d.companyName || '',
          industry: d.industry || 'Technology',
          companySize: d.companySize || '1-50',
          companyDescription: d.companyDescription || '',
          location: d.location || '',
          websiteUrl: d.websiteUrl || '',
          linkedinUrl: d.linkedinUrl || '',
          twitterUrl: d.twitterUrl || '',
          facebookUrl: d.facebookUrl || '',
          instagramUrl: d.instagramUrl || '',
          contactName: d.fullName || '',
          contactEmail: d.email || '',
          companyLogo: d.companyLogo || null,
        });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading || !form) {
    return (
      <DashboardLayout role="employer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await employerAPI.updateProfile({
        fullName: form.contactName,
        companyName: form.companyName,
        industry: form.industry,
        companySize: form.companySize,
        companyDescription: form.companyDescription || null,
        location: form.location || null,
        websiteUrl: form.websiteUrl || null,
        linkedinUrl: form.linkedinUrl || null,
        twitterUrl: form.twitterUrl || null,
        facebookUrl: form.facebookUrl || null,
        instagramUrl: form.instagramUrl || null,
      });
      updateUser({
        fullName: form.contactName,
        companyName: form.companyName,
        companyLogo: form.companyLogo,
      });
      toast.success('Profile saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    try {
      const res = await employerAPI.uploadCompanyLogo(file);
      const companyLogo = res.data.data.companyLogo;
      setForm((prev) => ({ ...prev, companyLogo }));
      updateUser({ companyLogo });
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-600 transition-colors duration-150';
  const labelClass =
    'block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1.5 tracking-wide uppercase';

  return (
    <DashboardLayout role="employer">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleLogoUpload}
      />

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">YOUR COMPANY</p>
                <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                  Company Profile
                </h1>
                <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
                  Keep your profile updated to attract top talent.
                </p>
              </div>
              <div className="flex rounded-xl bg-white/10 backdrop-blur-sm p-1 gap-1 w-fit border border-white/10">
                {['edit', 'preview'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      activeTab === tab
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab === 'edit' ? 'Edit Profile' : 'Preview'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {activeTab === 'edit' ? (
          <form onSubmit={handleSave} className="space-y-6 animate-fade-in-up">
            {/* Logo Upload */}
            <SectionCard icon={Camera} gradient="from-primary-500 to-primary-600" title="Company Logo">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {form.companyLogo ? (
                    <img src={resolveMediaUrl(form.companyLogo)} alt="Logo" className="w-24 h-24 rounded-2xl object-cover shadow-glow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-glow-sm">
                      {form.companyName.charAt(0)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-elevated hover:from-primary-600 hover:to-primary-700 transition-colors duration-150 cursor-pointer"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm text-surface-600 dark:text-surface-400 font-medium hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 cursor-pointer"
                  >
                    <Upload size={15} />
                    Upload new logo
                  </button>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-2">
                    JPG or PNG. Max 2MB.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Company Info */}
            <SectionCard icon={Building2} gradient="from-accent-500 to-accent-600" title="Company Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Company Name</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input name="companyName" value={form.companyName} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="Your company name" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Industry</label>
                  <div className="relative">
                    <select name="industry" value={form.industry} onChange={handleChange} className={`${inputClass} appearance-none pr-9`}>
                      {INDUSTRIES.map((ind) => (<option key={ind} value={ind}>{ind}</option>))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Company Size</label>
                  <div className="relative">
                    <select name="companySize" value={form.companySize} onChange={handleChange} className={`${inputClass} appearance-none pr-9`}>
                      {COMPANY_SIZES.map((size) => (<option key={size} value={size}>{size} employees</option>))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Location</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input name="location" value={form.location} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="City, Country" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Company Description</label>
                  <textarea
                    name="companyDescription"
                    value={form.companyDescription}
                    onChange={handleChange}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Tell students about your company, culture, and mission..."
                  />
                  <p className="text-xs text-surface-400 mt-1 text-right">
                    {form.companyDescription.length} / 5000 characters
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Social / Web Links */}
            <SectionCard icon={Globe} gradient="from-violet-500 to-violet-600" title="Web & Social Links">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'websiteUrl', label: 'Website', Icon: Globe, placeholder: 'https://yourcompany.com' },
                  { name: 'linkedinUrl', label: 'LinkedIn', Icon: Linkedin, placeholder: 'https://linkedin.com/company/...' },
                  { name: 'twitterUrl', label: 'Twitter / X', Icon: Twitter, placeholder: 'https://twitter.com/...' },
                  { name: 'facebookUrl', label: 'Facebook', Icon: Facebook, placeholder: 'https://facebook.com/...' },
                  { name: 'instagramUrl', label: 'Instagram', Icon: Instagram, placeholder: 'https://instagram.com/...' },
                ].map(({ name, label, Icon, placeholder }) => (
                  <div key={name}>
                    <label className={labelClass}>{label}</label>
                    <div className="relative">
                      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input name={name} value={form[name]} onChange={handleChange} className={`${inputClass} pl-10`} placeholder={placeholder} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Contact Person */}
            <SectionCard icon={User} gradient="from-amber-500 to-amber-600" title="Contact Person">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input name="contactName" value={form.contactName} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="Contact person name" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input name="contactEmail" value={form.contactEmail} readOnly className={`${inputClass} pl-10 bg-surface-50 dark:bg-surface-800 cursor-not-allowed text-surface-400`} />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Save */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-60 transition-colors duration-150 cursor-pointer shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2"
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          /* Preview Mode */
          <div className="group relative rounded-xl overflow-hidden animate-fade-in-up bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative p-6">
              <p className="text-xs text-surface-400 mb-6 flex items-center gap-1.5">
                <Eye size={13} />
                This is how your company appears to students
              </p>
              <div className="flex items-start gap-5 pb-6 border-b border-surface-100 dark:border-surface-700">
                {form.companyLogo ? (
                  <img src={resolveMediaUrl(form.companyLogo)} alt="Logo" className="w-20 h-20 rounded-2xl object-cover shadow-glow-sm shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-glow-sm shrink-0">
                    {form.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-heading text-xl font-extrabold text-surface-900 dark:text-white tracking-tight">{form.companyName}</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {form.industry} · {form.companySize} employees{form.location ? ` · ${form.location}` : ''}
                  </p>
                  <div className="flex gap-3 mt-3">
                    {form.websiteUrl && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                        <Globe size={12} /> Website
                      </span>
                    )}
                    {form.linkedinUrl && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                        <Linkedin size={12} /> LinkedIn
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">About</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">
                  {form.companyDescription || 'No description provided.'}
                </p>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">Contact</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {form.contactName} · {form.contactEmail}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
