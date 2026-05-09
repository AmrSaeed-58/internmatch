import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Search,
  Trash2,
  Lock,
  Save,
  AlertCircle,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import * as employerAPI from '../../api/employer';
import * as skillsAPI from '../../api/skills';

const WORK_TYPES = [
  { value: 'on-site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];
const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function EditInternship() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    country: '',
    workType: 'on-site',
    durationMonths: '',
    salaryMin: '',
    salaryMax: '',
    minimumGpa: '',
    deadline: '',
  });

  const [skills, setSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillResults, setSkillResults] = useState([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [saved, setSaved] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [internshipStatus, setInternshipStatus] = useState('');

  // Fetch internship data
  useEffect(() => {
    async function fetchInternship() {
      try {
        const res = await employerAPI.getInternship(id);
        const data = res.data.data;
        setForm({
          title: data.title || '',
          description: data.description || '',
          city: data.city || '',
          country: data.country || '',
          workType: data.workType || 'on-site',
          durationMonths: data.durationMonths || '',
          salaryMin: data.salaryMin ?? '',
          salaryMax: data.salaryMax ?? '',
          minimumGpa: data.minimumGpa ?? '',
          deadline: data.deadline ? data.deadline.split('T')[0] : '',
        });
        setSkills(
          (data.skills || []).map((s) => ({
            skillId: s.skillId,
            displayName: s.displayName,
            requiredLevel: s.requiredLevel || 'intermediate',
            isMandatory: s.isMandatory !== undefined ? s.isMandatory : true,
          }))
        );
        setInternshipStatus(data.status || '');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load internship');
        navigate('/employer/internships');
      } finally {
        setLoading(false);
      }
    }
    fetchInternship();
  }, [id, navigate]);

  // Search skills from API
  const searchSkills = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setSkillResults([]);
      return;
    }
    try {
      const res = await skillsAPI.searchSkills(q, 20);
      setSkillResults(res.data.data || []);
    } catch {
      setSkillResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchSkills(skillSearch), 250);
    return () => clearTimeout(timer);
  }, [skillSearch, searchSkills]);

  const filteredSkills = skillResults.filter(
    (s) => !skills.some((sk) => sk.skillId === s.skillId)
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSaved(false);
  }

  function addSkill(skill) {
    setSkills((prev) => [
      ...prev,
      { skillId: skill.skillId, displayName: skill.displayName, requiredLevel: 'intermediate', isMandatory: true },
    ]);
    setSkillSearch('');
    setShowSkillDropdown(false);
  }

  function addCustomSkill() {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    setSkills((prev) => [
      ...prev,
      { skillId: `custom-${Date.now()}`, displayName: trimmed, requiredLevel: 'intermediate', isMandatory: true, isCustom: true },
    ]);
    setCustomSkill('');
  }

  function removeSkill(skillId) {
    setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  }

  function updateSkill(skillId, field, value) {
    setSkills((prev) => prev.map((s) => (s.skillId === skillId ? { ...s, [field]: value } : s)));
  }

  async function handleExtractSkills() {
    const text = (form.description || '').trim();
    if (text.length < 30) {
      setErrors((prev) => ({
        ...prev,
        description: 'Add at least 30 characters of description so AI can extract skills',
      }));
      return;
    }
    setExtracting(true);
    try {
      const res = await employerAPI.extractSkillsFromDescription(text);
      const incoming = res.data?.data?.skills || [];
      if (incoming.length === 0) {
        toast.info('Couldn’t pull any skills from that. Try adding more detail.');
        return;
      }

      let added = 0;
      let skipped = 0;
      setSkills((prev) => {
        const next = [...prev];
        const existingDb = new Set(prev.filter((s) => !s.isCustom).map((s) => s.skillId));
        const existingNames = new Set(
          prev.map((s) => (s.displayName || '').toLowerCase().trim())
        );
        for (const item of incoming) {
          const nameKey = (item.displayName || '').toLowerCase().trim();
          const isDup = (item.skillId && existingDb.has(item.skillId)) || existingNames.has(nameKey);
          if (isDup) {
            skipped += 1;
            continue;
          }
          next.push({
            skillId: item.skillId || `custom-${Date.now()}-${added}`,
            displayName: item.displayName,
            requiredLevel: item.requiredLevel || 'intermediate',
            isMandatory: item.isMandatory !== false,
            isCustom: !item.skillId,
          });
          existingNames.add(nameKey);
          added += 1;
        }
        return next;
      });

      setErrors((prev) => ({ ...prev, skills: '' }));
      const summary = [
        added > 0 && `Added ${added} skill${added === 1 ? '' : 's'}`,
        skipped > 0 && `${skipped} already in your list`,
      ].filter(Boolean).join(' · ');
      toast.success(summary || 'Skills extracted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not extract skills');
    } finally {
      setExtracting(false);
    }
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.country.trim()) e.country = 'Required';
    if (!form.durationMonths) e.durationMonths = 'Required';
    if (form.deadline) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(form.deadline) <= today) e.deadline = 'Deadline must be in the future';
    }
    if (form.salaryMin && form.salaryMax && parseFloat(form.salaryMax) < parseFloat(form.salaryMin)) {
      e.salaryMax = 'Maximum salary cannot be lower than minimum';
    }
    if (form.minimumGpa) {
      const g = parseFloat(form.minimumGpa);
      if (Number.isNaN(g) || g < 0 || g > 4) e.minimumGpa = 'Minimum GPA must be between 0.00 and 4.00';
    }
    if (skills.length === 0) e.skills = 'At least one skill is required';
    if (skills.length > 0 && skills.every((s) => !s.isMandatory)) {
      e.skills = 'At least one skill must be marked mandatory';
    }
    return e;
  }

  // Tomorrow as the earliest selectable deadline.
  const minDeadline = (() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  })();

  async function handleSave(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        durationMonths: parseInt(form.durationMonths),
        salaryMin: form.salaryMin !== '' ? parseFloat(form.salaryMin) : null,
        salaryMax: form.salaryMax !== '' ? parseFloat(form.salaryMax) : null,
        minimumGpa: form.minimumGpa !== '' ? parseFloat(form.minimumGpa) : null,
        deadline: form.deadline || null,
        skills: skills.map((s) => ({
          skillId: typeof s.skillId === 'string' && s.skillId.startsWith('custom-') ? undefined : s.skillId,
          skillName: s.displayName,
          requiredLevel: s.requiredLevel,
          isMandatory: s.isMandatory,
        })),
      };
      await employerAPI.updateInternship(id, payload);
      setSaved(true);
      toast.success('Internship updated successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    try {
      await employerAPI.closeInternship(id);
      toast.success('Internship closed');
      setShowCloseModal(false);
      navigate('/employer/internships');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close internship');
      setShowCloseModal(false);
    }
  }

  async function handleDelete() {
    try {
      await employerAPI.deleteInternship(id);
      toast.success('Internship deleted');
      setShowDeleteModal(false);
      navigate('/employer/internships');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete internship');
      setShowDeleteModal(false);
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-600 transition-colors duration-150';
  const labelClass =
    'block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1.5 tracking-wide uppercase';
  const errorClass = 'text-xs text-red-500 mt-1 flex items-center gap-1';

  if (loading) {
    return (
      <DashboardLayout role="employer">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
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
          <div className="relative p-7 md:p-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">Edit Posting</p>
              <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                Edit Internship
              </h1>
              <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
                Editing: <span className="font-bold text-white">{form.title}</span>
              </p>
            </div>
            {/* Danger actions */}
            <div className="flex gap-2 shrink-0">
              {internshipStatus === 'active' && (
                <button
                  type="button"
                  onClick={() => setShowCloseModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/20 transition-colors duration-150 cursor-pointer border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Lock size={13} />
                  Close Internship
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-red-500/30 transition-colors duration-150 cursor-pointer border border-red-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Details */}
          <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-700">
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
                  <Briefcase size={16} className="text-white" />
                </div>
                <h2 className="font-heading font-bold text-surface-900 dark:text-white tracking-tight">Internship Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className={`${inputClass} pl-10 ${errors.title ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                    />
                  </div>
                  {errors.title && <p className={errorClass}><AlertCircle size={11} />{errors.title}</p>}
                </div>

                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                    className={`${inputClass} resize-none ${errors.description ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                  />
                  {errors.description && <p className={errorClass}><AlertCircle size={11} />{errors.description}</p>}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>City *</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className={`${inputClass} pl-10 ${errors.city ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                      />
                    </div>
                    {errors.city && <p className={errorClass}><AlertCircle size={11} />{errors.city}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Country *</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className={`${inputClass} pl-10 ${errors.country ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                      />
                    </div>
                    {errors.country && <p className={errorClass}><AlertCircle size={11} />{errors.country}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Work Type</label>
                    <div className="flex gap-2">
                      {WORK_TYPES.map((wt) => (
                        <label
                          key={wt.value}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors duration-150 ${
                            form.workType === wt.value
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                              : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                          }`}
                        >
                          <input type="radio" name="workType" value={wt.value} checked={form.workType === wt.value} onChange={handleChange} className="sr-only" />
                          {wt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Duration (months) *</label>
                    <div className="relative">
                      <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input name="durationMonths" type="number" min="1" max="24" value={form.durationMonths} onChange={handleChange}
                        className={`${inputClass} pl-10 ${errors.durationMonths ? 'border-red-400 focus:ring-red-400/30' : ''}`} />
                    </div>
                    {errors.durationMonths && <p className={errorClass}><AlertCircle size={11} />{errors.durationMonths}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Salary Min</label>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input name="salaryMin" type="number" min="0" value={form.salaryMin} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="optional" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Salary Max</label>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input name="salaryMax" type="number" min="0" value={form.salaryMax} onChange={handleChange}
                        className={`${inputClass} pl-10 ${errors.salaryMax ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                        placeholder="optional" />
                    </div>
                    {errors.salaryMax && <p className={errorClass}><AlertCircle size={11} />{errors.salaryMax}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Application Deadline</label>
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input name="deadline" type="date" min={minDeadline} value={form.deadline} onChange={handleChange}
                        className={`${inputClass} pl-10 ${errors.deadline ? 'border-red-400 focus:ring-red-400/30' : ''}`} />
                    </div>
                    {errors.deadline && <p className={errorClass}><AlertCircle size={11} />{errors.deadline}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Minimum GPA</label>
                    <input
                      name="minimumGpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={form.minimumGpa}
                      onChange={handleChange}
                      className={`${inputClass} ${errors.minimumGpa ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                      placeholder="optional (e.g. 3.00)"
                    />
                    {errors.minimumGpa && <p className={errorClass}><AlertCircle size={11} />{errors.minimumGpa}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="group relative rounded-xl overflow-hidden bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-card">
            <div className="relative">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-100 dark:border-surface-700">
                <div className="w-9 h-9 rounded-xl bg-accent-600 flex items-center justify-center shadow-sm">
                  <Sparkles size={16} className="text-white" />
                </div>
                <h2 className="font-heading font-bold text-surface-900 dark:text-white tracking-tight">Required Skills</h2>
              </div>
              <div className="p-6">
                {/* AI Extract from description */}
                <div className="mb-4 p-4 rounded-xl border border-dashed border-accent-300/60 dark:border-accent-600/40 bg-gradient-to-r from-accent-50/60 to-primary-50/40 dark:from-accent-900/10 dark:to-primary-900/10">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Wand2 size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-surface-900 dark:text-white mb-0.5">
                        Auto-extract skills with AI
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                        Re-read the job description and suggest required skills with proficiency levels.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExtractSkills}
                      disabled={extracting || (form.description || '').trim().length < 30}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-accent-600 to-primary-600 text-white text-xs font-bold hover:from-accent-700 hover:to-primary-700 transition-colors duration-150 cursor-pointer shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {extracting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          Extract
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative mb-3">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                  <input
                    value={skillSearch}
                    onChange={(e) => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }}
                    onFocus={() => setShowSkillDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSkillDropdown(false), 150)}
                    className={`${inputClass} pl-10`}
                    placeholder="Search skills..."
                  />
                  {showSkillDropdown && filteredSkills.length > 0 && (
                    <div className="absolute z-20 w-full top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-floating overflow-hidden max-h-48 overflow-y-auto">
                      {filteredSkills.slice(0, 8).map((skill) => (
                        <button key={skill.skillId} type="button" onMouseDown={() => addSkill(skill)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-100 cursor-pointer text-left">
                          <span>{skill.displayName}</span>
                          <span className="text-xs text-surface-400 capitalize">{skill.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-5">
                  <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                    className={`${inputClass} flex-1`} placeholder="Add custom skill..." />
                  <button type="button" onClick={addCustomSkill} disabled={!customSkill.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-bold hover:bg-surface-200 dark:hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30">
                    <Plus size={14} /> Add
                  </button>
                </div>

                {errors.skills && <p className={errorClass}><AlertCircle size={11} />{errors.skills}</p>}

                <div className="space-y-2.5 stagger-children">
                  {skills.map((skill) => {
                    const levelNum = skill.requiredLevel === 'beginner' ? 1 : skill.requiredLevel === 'advanced' ? 3 : 2;
                    const levelColor = skill.requiredLevel === 'beginner' ? 'bg-slate-500' : skill.requiredLevel === 'advanced' ? 'bg-accent-500' : 'bg-primary-500';
                    return (
                      <motion.div
                        key={skill.skillId}
                        whileHover={{ scale: 1.005 }}
                        className={`group/skill flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-200 ${
                          skill.isMandatory
                            ? 'bg-gradient-to-r from-primary-50/60 to-transparent dark:from-primary-900/10 dark:to-transparent border-primary-200/50 dark:border-primary-800/30'
                            : 'bg-surface-50/80 dark:bg-surface-800/40 border-surface-100 dark:border-surface-700/50'
                        }`}
                      >
                        <div className="flex gap-0.5 items-end shrink-0">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className={`w-1.5 rounded-full ${n <= levelNum ? `${levelColor} ${n === 1 ? 'h-2' : n === 2 ? 'h-3' : 'h-4'}` : `bg-surface-200 dark:bg-surface-700 ${n === 1 ? 'h-2' : n === 2 ? 'h-3' : 'h-4'}`}`} />
                          ))}
                        </div>
                        <div className="flex-1 flex items-center gap-3 flex-wrap min-w-0">
                          <span className="text-sm font-bold text-surface-900 dark:text-white truncate">
                            {skill.displayName}
                            {skill.isCustom && <span className="ml-1.5 text-[10px] font-semibold text-surface-400 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded-md">custom</span>}
                          </span>
                          <select value={skill.requiredLevel} onChange={(e) => updateSkill(skill.skillId, 'requiredLevel', e.target.value)}
                            className="text-[11px] font-semibold border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1 bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer capitalize">
                            {PROFICIENCY_LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
                          </select>
                          <button type="button" onClick={() => updateSkill(skill.skillId, 'isMandatory', !skill.isMandatory)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                              skill.isMandatory
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 ring-1 ring-primary-200/60 dark:ring-primary-700/30'
                                : 'bg-surface-100 text-surface-500 dark:bg-surface-700/50 dark:text-surface-400 ring-1 ring-surface-200/60 dark:ring-surface-700/40 hover:ring-primary-300 dark:hover:ring-primary-700'
                            }`}>
                            {skill.isMandatory ? 'Mandatory' : 'Optional'}
                          </button>
                        </div>
                        <button type="button" onClick={() => removeSkill(skill.skillId)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-300 dark:text-surface-600 opacity-0 group-hover/skill:opacity-100 hover:!text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 shrink-0">
                          <X size={13} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-accent-600 dark:text-accent-400 font-bold animate-fade-in-up">
                <CheckCircle2 size={15} /> Saved!
              </span>
            )}
            <button type="button" onClick={() => navigate('/employer/internships')}
              className="px-5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 text-sm font-bold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-bold hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Close Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={() => setShowCloseModal(false)} />
          <div className="relative rounded-xl overflow-hidden max-w-md w-full animate-scale-in bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-floating">
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-600 flex items-center justify-center shadow-sm">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <h3 className="font-heading text-lg font-bold text-surface-900 dark:text-white tracking-tight">Close Internship?</h3>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed mb-6">
                Closing this internship will stop accepting new applications and hide it from active listings. Existing applicants will not be affected.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-bold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleClose}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold hover:from-amber-600 hover:to-amber-700 transition-colors duration-150 cursor-pointer shadow-lg">
                  Close Internship
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative rounded-xl overflow-hidden max-w-md w-full animate-scale-in bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-700 shadow-floating">
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                  <Trash2 size={20} className="text-white" />
                </div>
                <h3 className="font-heading text-lg font-bold text-surface-900 dark:text-white tracking-tight">Delete Internship?</h3>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed mb-6">
                This action is <strong className="text-red-600 dark:text-red-400">permanent and irreversible</strong>. All applications and data associated with this internship will be deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-bold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 transition-colors duration-150 cursor-pointer shadow-lg">
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
