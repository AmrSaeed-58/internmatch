import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Plus,
  X,
  CheckCircle2,
  Search,
  AlertCircle,
  Star,
  FileText,
  Sparkles,
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

const emptyForm = {
  title: '',
  description: '',
  location: '',
  workType: 'hybrid',
  durationMonths: '',
  salaryMin: '',
  salaryMax: '',
  deadline: '',
};

export default function PostInternship() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [skills, setSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [allSkills, setAllSkills] = useState([]);

  // Load skills from database
  useEffect(() => {
    async function loadSkills() {
      try {
        const res = await skillsAPI.searchSkills('', 200);
        setAllSkills(res.data.data);
      } catch (err) {
        // Skills will be empty, user can still add custom
      }
    }
    loadSkills();
  }, []);

  const filteredSkills = allSkills.filter(
    (s) =>
      s.displayName.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !skills.some((sk) => sk.skillId === s.skillId)
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function addSkill(skill) {
    setSkills((prev) => [
      ...prev,
      {
        skillId: skill.skillId,
        displayName: skill.displayName,
        requiredLevel: 'intermediate',
        isMandatory: true,
      },
    ]);
    setSkillSearch('');
    setShowSkillDropdown(false);
  }

  function addCustomSkill() {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    const id = `custom-${Date.now()}`;
    setSkills((prev) => [
      ...prev,
      {
        skillId: id,
        displayName: trimmed,
        requiredLevel: 'intermediate',
        isMandatory: true,
        isCustom: true,
      },
    ]);
    setCustomSkill('');
  }

  function removeSkill(id) {
    setSkills((prev) => prev.filter((s) => s.skillId !== id));
  }

  function updateSkill(id, field, value) {
    setSkills((prev) =>
      prev.map((s) => (s.skillId === id ? { ...s, [field]: value } : s))
    );
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.durationMonths) e.durationMonths = 'Duration is required';
    // Deadline is optional per spec
    if (skills.length === 0) e.skills = 'Add at least one required skill';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        workType: form.workType,
        durationMonths: parseInt(form.durationMonths),
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : null,
        deadline: form.deadline || null,
        skills: skills.map((s) => ({
          skillId: s.isCustom ? undefined : s.skillId,
          skillName: s.isCustom ? s.displayName : undefined,
          requiredLevel: s.requiredLevel,
          isMandatory: s.isMandatory,
        })),
      };

      await employerAPI.createInternship(payload);
      setSubmitted(true);
      setTimeout(() => navigate('/employer/internships'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post internship');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-600 transition-colors duration-150';

  const labelClass =
    'block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1.5 tracking-wide uppercase';

  const errorClass = 'text-xs text-red-500 mt-1 flex items-center gap-1';

  if (submitted) {
    return (
      <DashboardLayout role="employer">
        <div className="max-w-md mx-auto mt-20 text-center space-y-4 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-accent-600 flex items-center justify-center mx-auto shadow-glow-sm">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">
            Internship Submitted!
          </h2>
          <p className="text-surface-500 dark:text-surface-400 text-sm leading-relaxed">
            Your internship has been submitted for admin review. It will go live once approved.
            Redirecting you now...
          </p>
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
          <div className="relative p-7 md:p-10">
            <p className="text-primary-200/80 text-sm font-semibold tracking-wide uppercase mb-2">New Posting</p>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
              Post New Internship
            </h1>
            <p className="text-primary-100/70 text-base leading-relaxed max-w-lg font-medium">
              Fill in the details below. Your posting will be reviewed before going live.
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                      placeholder="e.g. Frontend Developer Intern"
                    />
                  </div>
                  {errors.title && (
                    <p className={errorClass}><AlertCircle size={11} />{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    className={`${inputClass} resize-none ${errors.description ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                    placeholder="Describe responsibilities, what students will learn, team culture..."
                  />
                  {errors.description && (
                    <p className={errorClass}><AlertCircle size={11} />{errors.description}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Location *</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        className={`${inputClass} pl-10 ${errors.location ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                        placeholder="City, Country"
                      />
                    </div>
                    {errors.location && (
                      <p className={errorClass}><AlertCircle size={11} />{errors.location}</p>
                    )}
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
                          <input
                            type="radio"
                            name="workType"
                            value={wt.value}
                            checked={form.workType === wt.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
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
                      <input
                        name="durationMonths"
                        type="number"
                        min="1"
                        max="24"
                        value={form.durationMonths}
                        onChange={handleChange}
                        className={`${inputClass} pl-10 ${errors.durationMonths ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                        placeholder="3"
                      />
                    </div>
                    {errors.durationMonths && (
                      <p className={errorClass}><AlertCircle size={11} />{errors.durationMonths}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Salary Min (optional)</label>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        name="salaryMin"
                        type="number"
                        min="0"
                        value={form.salaryMin}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Salary Max (optional)</label>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        name="salaryMax"
                        type="number"
                        min="0"
                        value={form.salaryMax}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Application Deadline</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input
                      name="deadline"
                      type="date"
                      value={form.deadline}
                      onChange={handleChange}
                      className={`${inputClass} pl-10 ${errors.deadline ? 'border-red-400 focus:ring-red-400/30' : ''}`}
                    />
                  </div>
                  {errors.deadline && (
                    <p className={errorClass}><AlertCircle size={11} />{errors.deadline}</p>
                  )}
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
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-5">
                  Add at least one skill. Set the minimum proficiency level and whether it is mandatory.
                </p>

                {/* Skill search */}
                <div className="relative mb-4">
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    <input
                      value={skillSearch}
                      onChange={(e) => {
                        setSkillSearch(e.target.value);
                        setShowSkillDropdown(true);
                      }}
                      onFocus={() => setShowSkillDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSkillDropdown(false), 150)}
                      className={`${inputClass} pl-10`}
                      placeholder="Search skills to add..."
                    />
                  </div>
                  {showSkillDropdown && filteredSkills.length > 0 && (
                    <div className="absolute z-20 w-full top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-floating overflow-hidden max-h-48 overflow-y-auto">
                      {filteredSkills.slice(0, 8).map((skill) => (
                        <button
                          key={skill.skillId}
                          type="button"
                          onMouseDown={() => addSkill(skill)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-100 cursor-pointer text-left"
                        >
                          <span>{skill.displayName}</span>
                          <span className="text-xs text-surface-400 capitalize">{skill.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom skill input */}
                <div className="flex gap-2 mb-5">
                  <input
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                    className={`${inputClass} flex-1`}
                    placeholder="Add custom skill..."
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    disabled={!customSkill.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-bold hover:bg-surface-200 dark:hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 shrink-0"
                  >
                    <Plus size={14} />
                    Add Custom
                  </button>
                </div>

                {errors.skills && (
                  <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                    <AlertCircle size={11} />{errors.skills}
                  </p>
                )}

                {/* Added skills list */}
                {skills.length > 0 && (
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
                          {/* Level bar indicator */}
                          <div className="flex gap-0.5 items-end shrink-0">
                            {[1, 2, 3].map((n) => (
                              <div
                                key={n}
                                className={`w-1.5 rounded-full ${
                                  n <= levelNum
                                    ? `${levelColor} ${n === 1 ? 'h-2' : n === 2 ? 'h-3' : 'h-4'}`
                                    : `bg-surface-200 dark:bg-surface-700 ${n === 1 ? 'h-2' : n === 2 ? 'h-3' : 'h-4'}`
                                }`}
                              />
                            ))}
                          </div>

                          <div className="flex-1 flex items-center gap-3 flex-wrap min-w-0">
                            <span className="text-sm font-bold text-surface-900 dark:text-white truncate">
                              {skill.displayName}
                              {skill.isCustom && (
                                <span className="ml-1.5 text-[10px] font-semibold text-surface-400 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded-md">custom</span>
                              )}
                            </span>
                            <select
                              value={skill.requiredLevel}
                              onChange={(e) => updateSkill(skill.skillId, 'requiredLevel', e.target.value)}
                              className="text-[11px] font-semibold border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1 bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer capitalize"
                            >
                              {PROFICIENCY_LEVELS.map((l) => (
                                <option key={l} value={l} className="capitalize">{l}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => updateSkill(skill.skillId, 'isMandatory', !skill.isMandatory)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                skill.isMandatory
                                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 ring-1 ring-primary-200/60 dark:ring-primary-700/30'
                                  : 'bg-surface-100 text-surface-500 dark:bg-surface-700/50 dark:text-surface-400 ring-1 ring-surface-200/60 dark:ring-surface-700/40 hover:ring-primary-300 dark:hover:ring-primary-700'
                              }`}
                            >
                              {skill.isMandatory ? 'Mandatory' : 'Optional'}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill.skillId)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-300 dark:text-surface-600 opacity-0 group-hover/skill:opacity-100 hover:!text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {skills.length === 0 && (
                  <div className="text-center py-6 text-sm text-surface-400 dark:text-surface-500 border border-dashed border-surface-200 dark:border-surface-700 rounded-xl">
                    No skills added yet. Search or add custom skills above.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/employer/internships')}
              className="px-5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 text-sm font-bold hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-bold hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 transition-colors duration-150 cursor-pointer shadow-glow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2"
            >
              <Star size={15} />
              Submit for Review
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
