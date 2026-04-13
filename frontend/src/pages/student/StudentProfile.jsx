import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Linkedin,
  Github,
  Instagram,
  Calendar,
  Save,
  GraduationCap,
  BookOpen,
  FileText,
  Upload,
  Trash2,
  Plus,
  X,
  Settings,
  Edit2,
  Edit3,
  Cpu,
  ArrowRight,
  Loader2,
  MapPin,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import * as studentAPI from '../../api/student';
import { computeProfileStrength } from '../../utils/profileStrength';

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced'];

const JORDAN_UNIVERSITIES = [
  'University of Jordan',
  'Jordan University of Science and Technology',
  'Yarmouk University',
  'Mutah University',
  'Al al-Bayt University',
  'The Hashemite University',
  'Al-Balqa Applied University',
  'Tafila Technical University',
  'Al-Hussein Bin Talal University',
  'German Jordanian University',
  'Princess Sumaya University for Technology',
  'Philadelphia University',
  'Applied Science Private University',
  'Amman Arab University',
  'Petra University',
  'Al-Zaytoonah University of Jordan',
  'Isra University',
  'Middle East University',
  'Jadara University',
  'Jerash University',
  'Ajloun National University',
  'Irbid National University',
  'American University of Madaba',
  'Zarqa University',
  'Al-Ahliyya Amman University',
  'Luminus Technical University College',
  'Columbia University - Amman',
  'Jordan Academy of Music',
  'Jordan Media Institute',
];

const GENDER_OPTIONS = ['Male', 'Female'];

const PROFICIENCY_CONFIG = {
  beginner: {
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 ring-1 ring-slate-200/80 dark:ring-slate-700/50',
    badge: 'bg-slate-500',
    label: 'Beginner',
  },
  intermediate: {
    pill: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-1 ring-primary-200/60 dark:ring-primary-700/40',
    badge: 'bg-primary-500',
    label: 'Intermediate',
  },
  advanced: {
    pill: 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300 ring-1 ring-accent-200/60 dark:ring-accent-700/40',
    badge: 'bg-accent-500',
    label: 'Advanced',
  },
};

function SectionCard({ icon: Icon, title, gradient, action, children }) {
  return (
    <motion.div className="group relative rounded-2xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient || 'from-primary-500 to-primary-600'} flex items-center justify-center shadow-sm`}>
            <Icon size={16} className="text-white" />
          </div>
          <h2 className="font-heading font-bold text-surface-900 dark:text-white text-sm tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1.5 tracking-wide uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">{hint}</p>}
    </div>
  );
}

function TextInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-dark-card text-surface-900 dark:text-surface-100 text-sm placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500 transition-colors duration-200 ${className}`}
      {...props}
    />
  );
}

function SelectInput({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-dark-card text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500 transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function ReadField({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="text-xs font-bold text-surface-500 dark:text-surface-500 mb-1 tracking-wide uppercase">{label}</p>
      <div className="flex items-center gap-2 min-h-[24px]">
        {Icon && <Icon size={14} className="text-surface-400 dark:text-surface-500 shrink-0" />}
        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
          {value || <span className="text-surface-400 dark:text-surface-500 font-normal italic">Not set</span>}
        </p>
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 text-white text-sm font-bold transition-colors duration-200 cursor-pointer shadow-glow-sm hover:shadow-glow-md"
    >
      <Save size={14} />
      {saving ? 'Saving...' : 'Save Changes'}
    </motion.button>
  );
}

function EditToggleButton({ editing, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer ${
        editing
          ? 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
          : 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50'
      }`}
    >
      {editing ? <><X size={12} /> Cancel</> : <><Edit3 size={12} /> Edit</>}
    </button>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [original, setOriginal] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [editMode, setEditMode] = useState({ personal: false, academic: false });
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ displayName: '', proficiencyLevel: 'intermediate' });
  const resumeInputRef = useRef(null);
  const pictureInputRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          studentAPI.getProfile(),
          studentAPI.getSkills(),
        ]);
        setProfile(profileRes.data.data);
        setOriginal(profileRes.data.data);
        setSkills(skillsRes.data.data);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !profile) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const currentYear = new Date().getFullYear();
  const derivedStatus =
    profile.graduationYear > currentYear
      ? 'enrolled'
      : profile.graduationYear === currentYear
      ? 'graduating'
      : 'graduated';

  const profileStrength = computeProfileStrength(profile, skills);

  function toggleEdit(section) {
    if (editMode[section]) {
      setProfile(original);
    }
    setEditMode((m) => ({ ...m, [section]: !m[section] }));
  }

  async function handleSavePersonal() {
    setSaving((s) => ({ ...s, personal: true }));
    try {
      await studentAPI.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone || null,
        linkedinUrl: profile.linkedinUrl || null,
        githubUrl: profile.githubUrl || null,
        instagramUrl: profile.instagramUrl || null,
        bio: profile.bio || null,
        gender: profile.gender || null,
        dateOfBirth: profile.dateOfBirth || null,
        location: profile.location || null,
      });
      setOriginal(profile);
      setEditMode((m) => ({ ...m, personal: false }));
      toast.success('Personal info saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving((s) => ({ ...s, personal: false }));
    }
  }

  async function handleSaveAcademic() {
    setSaving((s) => ({ ...s, academic: true }));
    try {
      await studentAPI.updateProfile({
        university: profile.university,
        major: profile.major,
        graduationYear: profile.graduationYear,
        gpa: profile.gpa || null,
      });
      setOriginal(profile);
      setEditMode((m) => ({ ...m, academic: false }));
      toast.success('Academic info saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving((s) => ({ ...s, academic: false }));
    }
  }

  async function handleAddSkill() {
    if (!newSkill.displayName.trim()) return;
    try {
      await studentAPI.addSkills([{
        skillName: newSkill.displayName.trim(),
        proficiencyLevel: newSkill.proficiencyLevel,
      }]);
      const res = await studentAPI.getSkills();
      setSkills(res.data.data);
      setNewSkill({ displayName: '', proficiencyLevel: 'intermediate' });
      setShowAddSkill(false);
      toast.success(`Skill "${newSkill.displayName.trim()}" added`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add skill');
    }
  }

  async function handleRemoveSkill(skillId) {
    try {
      await studentAPI.removeSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
      toast.success('Skill removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove skill');
    }
  }

  async function handleResumeUpload(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setSaving((s) => ({ ...s, resume: true }));
    try {
      const uploadRes = await studentAPI.uploadResume(file);
      const staging = uploadRes.data.data;
      await studentAPI.confirmResume({ staging, confirmedSkills: staging.extractedSkills || [] });
      const profileRes = await studentAPI.getProfile();
      setProfile(profileRes.data.data);
      setOriginal(profileRes.data.data);
      const skillsRes = await studentAPI.getSkills();
      setSkills(skillsRes.data.data);
      toast.success('Resume uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setSaving((s) => ({ ...s, resume: false }));
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  }

  async function handleResumeDelete() {
    if (!window.confirm('Are you sure you want to delete your resume?')) return;
    try {
      await studentAPI.deleteResume();
      setProfile((p) => ({ ...p, resume: null, primaryResumeId: null }));
      setOriginal((p) => ({ ...p, resume: null, primaryResumeId: null }));
      toast.success('Resume deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete resume');
    }
  }

  async function handlePictureUpload(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    try {
      const res = await studentAPI.uploadProfilePicture(file);
      const url = res.data.data.profilePicture;
      setProfile((p) => ({ ...p, profilePicture: url }));
      setOriginal((p) => ({ ...p, profilePicture: url }));
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload picture');
    } finally {
      if (pictureInputRef.current) pictureInputRef.current.value = '';
    }
  }

  async function handlePictureDelete() {
    if (!profile.profilePicture) return;
    if (!window.confirm('Remove your profile picture?')) return;
    try {
      await studentAPI.deleteProfilePicture();
      setProfile((p) => ({ ...p, profilePicture: null }));
      setOriginal((p) => ({ ...p, profilePicture: null }));
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove picture');
    }
  }

  const initials = (profile.fullName || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DashboardLayout role="student">
      <input ref={resumeInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleResumeUpload} />
      <input ref={pictureInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePictureUpload} />

      {/* Profile Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 22 }}
        className="mb-8 relative rounded-2xl overflow-hidden border border-primary-500/20 dark:border-primary-400/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-600/15 via-transparent to-primary-400/10" />
        <div className="absolute -bottom-16 right-1/4 w-48 h-48 rounded-full bg-accent-400/10 blur-2xl" />
        <div className="relative p-7 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with upload + delete */}
          <div className="relative shrink-0">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture.startsWith('http') ? profile.profilePicture : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${profile.profilePicture}`}
                alt={profile.fullName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/30 shadow-elevated"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-3xl font-extrabold shadow-elevated">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <button
                onClick={() => pictureInputRef.current?.click()}
                className="w-8 h-8 rounded-xl bg-white dark:bg-dark-card flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                aria-label="Change picture"
              >
                <Edit2 size={13} />
              </button>
              {profile.profilePicture && (
                <button
                  onClick={handlePictureDelete}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-dark-card flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                  aria-label="Remove picture"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white tracking-tight mb-1">
              {profile.fullName}
            </h1>
            <p className="text-primary-200/80 text-sm font-medium mb-2 truncate">
              {profile.major} {profile.major && profile.university && '•'} {profile.university}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-200/80">
                <GraduationCap size={12} />
                {profile.gpa ? `GPA ${profile.gpa} • ` : ''}Class of {profile.graduationYear}
              </span>
              {profile.location && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-200/80">
                  <MapPin size={12} />
                  {profile.location}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                derivedStatus === 'enrolled'
                  ? 'bg-accent-500/20 text-accent-200 border border-accent-400/30'
                  : 'bg-white/10 text-white/80 border border-white/20'
              }`}>
                {derivedStatus}
              </span>
            </div>
          </div>

          <div className="text-center shrink-0 bg-white/10 rounded-xl px-4 py-3 border border-white/15 backdrop-blur-sm">
            <div className={`text-3xl font-extrabold font-heading ${profileStrength >= 80 ? 'text-accent-300' : 'text-amber-300'}`}>
              {profileStrength}%
            </div>
            <p className="text-xs text-primary-200/80 mt-0.5 font-medium">Profile Strength</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Personal Info */}
          <SectionCard
            icon={User}
            title="Personal Information"
            gradient="from-primary-500 to-primary-600"
            action={<EditToggleButton editing={editMode.personal} onClick={() => toggleEdit('personal')} />}
          >
            {editMode.personal ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField label="Full Name" required>
                    <TextInput value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full Name" />
                  </FormField>
                  <FormField label="Email" hint="Email cannot be changed here">
                    <TextInput value={profile.email} readOnly className="bg-surface-50 dark:bg-surface-800 cursor-not-allowed text-surface-400 dark:text-surface-500" />
                  </FormField>
                  <FormField label="Gender">
                    <SelectInput value={profile.gender || ''} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}>
                      <option value="">Prefer not to say</option>
                      {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </SelectInput>
                  </FormField>
                  <FormField label="Date of Birth">
                    <TextInput type="date" value={profile.dateOfBirth ? profile.dateOfBirth.substring(0, 10) : ''} onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                  </FormField>
                  <FormField label="Phone">
                    <TextInput value={profile.phone || ''} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+962 7X XXX XXXX" />
                  </FormField>
                  <FormField label="Location">
                    <TextInput value={profile.location || ''} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} placeholder="Amman, Jordan" />
                  </FormField>
                  <FormField label="LinkedIn">
                    <TextInput value={profile.linkedinUrl || ''} onChange={(e) => setProfile((p) => ({ ...p, linkedinUrl: e.target.value }))} placeholder="linkedin.com/in/username" />
                  </FormField>
                  <FormField label="GitHub">
                    <TextInput value={profile.githubUrl || ''} onChange={(e) => setProfile((p) => ({ ...p, githubUrl: e.target.value }))} placeholder="github.com/username" />
                  </FormField>
                  <FormField label="Instagram">
                    <TextInput value={profile.instagramUrl || ''} onChange={(e) => setProfile((p) => ({ ...p, instagramUrl: e.target.value }))} placeholder="instagram.com/username" />
                  </FormField>
                </div>
                <FormField label="Bio">
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell employers a bit about yourself..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-dark-card text-surface-900 dark:text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-y min-h-[80px]"
                  />
                </FormField>
                <div className="mt-4 flex justify-end">
                  <SaveButton onClick={handleSavePersonal} saving={saving.personal} />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ReadField label="Full Name" value={profile.fullName} icon={User} />
                <ReadField label="Email" value={profile.email} icon={Mail} />
                <ReadField label="Gender" value={profile.gender} icon={UserCircle2} />
                <ReadField label="Date of Birth" value={formatDate(profile.dateOfBirth)} icon={Calendar} />
                <ReadField label="Phone" value={profile.phone} icon={Phone} />
                <ReadField label="Location" value={profile.location} icon={MapPin} />
                <ReadField label="LinkedIn" value={profile.linkedinUrl} icon={Linkedin} />
                <ReadField label="GitHub" value={profile.githubUrl} icon={Github} />
                <ReadField label="Instagram" value={profile.instagramUrl} icon={Instagram} />
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold text-surface-500 dark:text-surface-500 mb-1 tracking-wide uppercase">Bio</p>
                  <p className="text-sm text-surface-700 dark:text-surface-200 leading-relaxed">
                    {profile.bio || <span className="text-surface-400 dark:text-surface-600 italic">No bio added yet</span>}
                  </p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Academic Info */}
          <SectionCard
            icon={GraduationCap}
            title="Academic Information"
            gradient="from-violet-500 to-violet-600"
            action={<EditToggleButton editing={editMode.academic} onClick={() => toggleEdit('academic')} />}
          >
            {editMode.academic ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField label="University" required>
                    <SelectInput value={profile.university || ''} onChange={(e) => setProfile((p) => ({ ...p, university: e.target.value }))}>
                      <option value="">Select university</option>
                      {JORDAN_UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                    </SelectInput>
                  </FormField>
                  <FormField label="Major" required>
                    <TextInput value={profile.major || ''} onChange={(e) => setProfile((p) => ({ ...p, major: e.target.value }))} placeholder="Computer Science" />
                  </FormField>
                  <FormField label="GPA">
                    <TextInput
                      type="number"
                      min="0"
                      max="4"
                      step="0.01"
                      value={profile.gpa || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, gpa: parseFloat(e.target.value) || '' }))}
                      placeholder="0.00 - 4.00"
                    />
                  </FormField>
                  <FormField label="Graduation Year" required>
                    <TextInput
                      type="number"
                      min="2020"
                      max="2035"
                      value={profile.graduationYear || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, graduationYear: parseInt(e.target.value) || '' }))}
                      placeholder="2025"
                    />
                  </FormField>
                </div>
                <div className="flex items-center gap-2.5 p-3.5 bg-surface-50 dark:bg-surface-700/30 rounded-xl border border-surface-200 dark:border-surface-800">
                  <BookOpen size={14} className="text-surface-400 dark:text-surface-500" />
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Graduation status is automatically derived:{' '}
                    <span className="font-bold capitalize text-surface-700 dark:text-surface-300">{derivedStatus}</span>
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <SaveButton onClick={handleSaveAcademic} saving={saving.academic} />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ReadField label="University" value={profile.university} icon={GraduationCap} />
                <ReadField label="Major" value={profile.major} icon={BookOpen} />
                <ReadField label="GPA" value={profile.gpa} />
                <ReadField label="Graduation Year" value={profile.graduationYear} icon={Calendar} />
                <div className="sm:col-span-2 flex items-center gap-2.5 p-3 bg-surface-50 dark:bg-surface-700/30 rounded-xl border border-surface-200 dark:border-surface-800">
                  <BookOpen size={14} className="text-surface-400" />
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Status: <span className="font-bold capitalize text-surface-700 dark:text-surface-300">{derivedStatus}</span>
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Skills */}
          <SectionCard icon={Cpu} title="Skills" gradient="from-accent-500 to-accent-600">
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.length === 0 && (
                <p className="text-xs text-surface-400 dark:text-surface-500 font-medium">No skills added yet</p>
              )}
              {skills.map((skill) => {
                const cfg = PROFICIENCY_CONFIG[skill.proficiencyLevel] || PROFICIENCY_CONFIG.intermediate;
                return (
                  <motion.div
                    key={skill.skillId}
                    whileHover={{ scale: 1.03 }}
                    className={`group/skill relative inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl ${cfg.pill} transition-all duration-200 cursor-default`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.badge} shrink-0`} />
                    <span className="text-xs font-bold leading-none">{skill.displayName}</span>
                    {skill.source === 'extracted' && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-300/40 dark:ring-amber-600/30 tracking-wider">
                        AI
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveSkill(skill.skillId)}
                      className="w-5 h-5 flex items-center justify-center rounded-lg text-current opacity-0 group-hover/skill:opacity-60 hover:!opacity-100 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all duration-200 cursor-pointer"
                      aria-label={`Remove ${skill.displayName}`}
                    >
                      <X size={10} />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {showAddSkill ? (
              <div className="border border-primary-200 dark:border-primary-800/50 rounded-xl p-4 bg-primary-50/50 dark:bg-primary-900/10 mb-3">
                <p className="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2">Add Skill</p>
                <div className="flex gap-2 mb-2">
                  <TextInput
                    value={newSkill.displayName}
                    onChange={(e) => setNewSkill((s) => ({ ...s, displayName: e.target.value }))}
                    placeholder="Skill name (e.g., React)"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 mb-3">
                  {PROFICIENCY_LEVELS.map((level) => {
                    const cfg = PROFICIENCY_CONFIG[level];
                    const isActive = newSkill.proficiencyLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setNewSkill((s) => ({ ...s, proficiencyLevel: level }))}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-primary-600 text-white border-primary-600 shadow-glow-sm'
                            : 'border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-primary-300'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSkill}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-xs font-bold transition-colors duration-200 cursor-pointer shadow-glow-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddSkill(false)}
                    className="flex-1 py-2 rounded-xl border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 text-xs font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSkill(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-600 text-surface-500 dark:text-surface-400 text-sm font-bold hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 cursor-pointer"
              >
                <Plus size={14} />
                Add Skill
              </button>
            )}
          </SectionCard>

          {/* Resume */}
          <SectionCard icon={FileText} title="Resume" gradient="from-amber-500 to-amber-600">
            {profile.resume ? (
              <div className="mb-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-200 dark:border-surface-800">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm shrink-0">
                    <FileText size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
                      {profile.resume.originalFilename}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      Uploaded {new Date(profile.resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={saving.resume}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 text-white text-xs font-bold transition-colors duration-200 cursor-pointer shadow-glow-sm"
                  >
                    <Upload size={12} />
                    {saving.resume ? 'Uploading...' : 'Replace'}
                  </button>
                  <button
                    onClick={handleResumeDelete}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold transition-colors duration-200 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl text-center">
                  <FileText size={28} className="text-surface-300 dark:text-surface-600 mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-surface-600 dark:text-surface-400 mb-0.5">No resume uploaded</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">PDF or DOCX, max 5MB</p>
                </div>
                <button
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={saving.resume}
                  className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 text-white text-sm font-bold transition-colors duration-200 cursor-pointer shadow-glow-sm"
                >
                  <Upload size={14} />
                  {saving.resume ? 'Uploading...' : 'Upload Resume'}
                </button>
              </div>
            )}
            <p className="text-xs text-surface-400 dark:text-surface-500 leading-relaxed font-medium">
              Uploading a resume enables AI skill extraction and improves your match accuracy.
            </p>
          </SectionCard>

          {/* Account Settings Link */}
          <Link to="/student/settings" className="group relative rounded-2xl overflow-hidden block border border-surface-200 dark:border-surface-700 bg-white dark:bg-dark-card">
            <div className="relative flex items-center justify-between px-5 py-4 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-500 flex items-center justify-center shadow-sm">
                  <Settings size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-800 dark:text-surface-200">Account Settings</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">Password, notifications, theme</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-surface-300 dark:text-surface-600 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-transform duration-200 shrink-0" />
            </div>
          </Link>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

