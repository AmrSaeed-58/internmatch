import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GraduationCap,
  Building2,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import API from '../../api/axios';
import { MAJORS, INDUSTRIES as INDUSTRY_OPTIONS, JORDAN_UNIVERSITIES } from '../../utils/academicData';

const COMPANY_SIZE_OPTIONS = [
  '1-50',
  '51-200',
  '201-500',
  '500+',
];

const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 16 }, (_, i) => CURRENT_YEAR - 5 + i);

const GENDER_OPTIONS = ['Male', 'Female'];

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: '1 uppercase letter', pass: /[A-Z]/.test(password) },
    { label: '1 number', pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-accent-500'];

  if (!password) return null;

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? colors[score - 1] : 'bg-surface-200 dark:bg-surface-700'
            }`}
          />
        ))}
      </div>
      {score < 3 && (
        <ul className="space-y-1">
          {checks.map(({ label, pass }) => (
            <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${pass ? 'text-accent-600 dark:text-accent-400' : 'text-surface-400 dark:text-surface-500'}`}>
              <CheckCircle2 size={11} className={pass ? 'text-accent-500' : 'text-surface-300 dark:text-surface-600'} />
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ id, label, error, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError) =>
  `w-full px-3.5 py-3 text-sm bg-surface-50 dark:bg-surface-800/60 border ${
    hasError
      ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30'
      : 'border-surface-200 dark:border-surface-700 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500'
  } rounded-xl text-surface-900 dark:text-white placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`;

const selectCls = (hasError) =>
  `w-full px-3.5 py-3 text-sm bg-surface-50 dark:bg-surface-800/60 border ${
    hasError
      ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30'
      : 'border-surface-200 dark:border-surface-700 focus:ring-primary-500/30 focus:border-primary-400 dark:focus:border-primary-500'
  } rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 cursor-pointer`;

function StudentForm({ onSuccess }) {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    university: '', major: '', graduationYear: '', gender: '', dateOfBirth: '', terms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include at least 1 uppercase letter.';
    else if (!/\d/.test(form.password)) errs.password = 'Must include at least 1 number.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.university) errs.university = 'University is required.';
    if (!form.major.trim()) errs.major = 'Major is required.';
    if (!form.graduationYear) errs.graduationYear = 'Graduation year is required.';
    if (!form.terms) errs.terms = 'You must accept the terms.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await API.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: 'student',
        university: form.university,
        major: form.major,
        graduationYear: parseInt(form.graduationYear, 10),
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      });
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const fieldErrors = {};
        data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        toast.error(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="s-fullName" label="Full Name" error={errors.fullName} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <User size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="s-fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange}
              placeholder="Sarah Ahmed" className={`${inputCls(!!errors.fullName)} pl-12`} />
          </div>
        </Field>
        <Field id="s-email" label="Email" error={errors.email} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <Mail size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="s-email" name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@university.edu" className={`${inputCls(!!errors.email)} pl-12`} />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="s-password" label="Password" error={errors.password} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <Lock size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="s-password" name="password" type={showPwd ? 'text' : 'password'} value={form.password}
              onChange={handleChange} placeholder="Create password" className={`${inputCls(!!errors.password)} pl-12 pr-11`} />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
              aria-label={showPwd ? 'Hide password' : 'Show password'}>
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </Field>
        <Field id="s-confirm" label="Confirm Password" error={errors.confirmPassword} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <Lock size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="s-confirm" name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
              onChange={handleChange} placeholder="Repeat password" className={`${inputCls(!!errors.confirmPassword)} pl-12 pr-11`} />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
              aria-label={showConfirm ? 'Hide' : 'Show'}>
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="s-university" label="University" error={errors.university} required>
          <select id="s-university" name="university" value={form.university} onChange={handleChange}
            className={selectCls(!!errors.university)}>
            <option value="">Select university</option>
            {JORDAN_UNIVERSITIES.map((uni) => (
              <option key={uni} value={uni}>{uni}</option>
            ))}
          </select>
        </Field>
        <Field id="s-major" label="Major" error={errors.major} required>
          <select id="s-major" name="major" value={form.major} onChange={handleChange}
            className={selectCls(!!errors.major)}>
            <option value="">Select your major</option>
            {MAJORS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field id="s-gradYear" label="Graduation Year" error={errors.graduationYear} required>
          <select id="s-gradYear" name="graduationYear" value={form.graduationYear} onChange={handleChange}
            className={selectCls(!!errors.graduationYear)}>
            <option value="">Select year</option>
            {GRADUATION_YEARS.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </Field>
        <Field id="s-gender" label="Gender" error={errors.gender}>
          <select id="s-gender" name="gender" value={form.gender} onChange={handleChange}
            className={selectCls(!!errors.gender)}>
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field id="s-dob" label="Date of Birth" error={errors.dateOfBirth}>
          <div className="relative group">
            <input id="s-dob" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange}
              className={inputCls(!!errors.dateOfBirth)} />
          </div>
        </Field>
      </div>

      <div>
        <div className="flex items-start gap-2.5">
          <input id="s-terms" name="terms" type="checkbox" checked={form.terms} onChange={handleChange}
            className="mt-0.5 w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500/30 bg-surface-50 dark:bg-surface-800 cursor-pointer" />
          <label htmlFor="s-terms" className="text-sm text-surface-600 dark:text-surface-300 cursor-pointer">
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>
          </label>
        </div>
        {errors.terms && (
          <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={11} />{errors.terms}
          </p>
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950 group">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Creating account...
          </>
        ) : (
          <>Create Student Account <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" /></>
        )}
      </button>
    </form>
  );
}

function EmployerForm({ onSuccess }) {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    companyName: '', industry: '', companySize: '', terms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include at least 1 uppercase letter.';
    else if (!/\d/.test(form.password)) errs.password = 'Must include at least 1 number.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.companyName.trim()) errs.companyName = 'Company name is required.';
    if (!form.industry) errs.industry = 'Industry is required.';
    if (!form.companySize) errs.companySize = 'Company size is required.';
    if (!form.terms) errs.terms = 'You must accept the terms.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await API.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: 'employer',
        companyName: form.companyName,
        industry: form.industry,
        companySize: form.companySize,
      });
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const fieldErrors = {};
        data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        toast.error(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="e-fullName" label="Full Name" error={errors.fullName} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <User size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="e-fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange}
              placeholder="Omar Hassan" className={`${inputCls(!!errors.fullName)} pl-12`} />
          </div>
        </Field>
        <Field id="e-email" label="Work Email" error={errors.email} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <Mail size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="e-email" name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@company.com" className={`${inputCls(!!errors.email)} pl-12`} />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="e-password" label="Password" error={errors.password} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <Lock size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="e-password" name="password" type={showPwd ? 'text' : 'password'} value={form.password}
              onChange={handleChange} placeholder="Create password" className={`${inputCls(!!errors.password)} pl-12 pr-11`} />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
              aria-label={showPwd ? 'Hide' : 'Show'}>
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </Field>
        <Field id="e-confirm" label="Confirm Password" error={errors.confirmPassword} required>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
              <Lock size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
            </div>
            <input id="e-confirm" name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
              onChange={handleChange} placeholder="Repeat password" className={`${inputCls(!!errors.confirmPassword)} pl-12 pr-11`} />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
              aria-label={showConfirm ? 'Hide' : 'Show'}>
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
      </div>

      <Field id="e-company" label="Company Name" error={errors.companyName} required>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center pointer-events-none group-focus-within:bg-primary-50 dark:group-focus-within:bg-primary-900/30 transition-colors duration-200">
            <Building2 size={13} className="text-surface-400 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors duration-200" />
          </div>
          <input id="e-company" name="companyName" type="text" value={form.companyName} onChange={handleChange}
            placeholder="TechCorp Solutions" className={`${inputCls(!!errors.companyName)} pl-12`} />
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="e-industry" label="Industry" error={errors.industry} required>
          <select id="e-industry" name="industry" value={form.industry} onChange={handleChange}
            className={selectCls(!!errors.industry)}>
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </Field>
        <Field id="e-size" label="Company Size" error={errors.companySize} required>
          <select id="e-size" name="companySize" value={form.companySize} onChange={handleChange}
            className={selectCls(!!errors.companySize)}>
            <option value="">Select size</option>
            {COMPANY_SIZE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt} employees</option>)}
          </select>
        </Field>
      </div>

      <div>
        <div className="flex items-start gap-2.5">
          <input id="e-terms" name="terms" type="checkbox" checked={form.terms} onChange={handleChange}
            className="mt-0.5 w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500/30 bg-surface-50 dark:bg-surface-800 cursor-pointer" />
          <label htmlFor="e-terms" className="text-sm text-surface-600 dark:text-surface-300 cursor-pointer">
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>
          </label>
        </div>
        {errors.terms && (
          <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={11} />{errors.terms}
          </p>
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950 group">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Creating account...
          </>
        ) : (
          <>Create Employer Account <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" /></>
        )}
      </button>
    </form>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('student');

  function handleSuccess() {
    navigate('/login', {
      state: { message: 'Account created! Sign in to get started.' },
    });
  }

  return (
    <div className="min-h-screen flex font-body bg-white dark:bg-surface-950">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] xl:w-[45%] bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-float" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary-400/10 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="reg-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reg-dots)" />
          </svg>
        </div>

        <Link to="/" className="relative flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg w-fit animate-fade-in-up">
          <img src="/internmatch-logo.png" alt="" className="w-10 h-10 object-contain select-none" draggable={false} />
          <span className="font-heading font-bold text-xl text-white tracking-tight">
            Intern<span className="text-primary-200">Match</span>
          </span>
        </Link>

        <div className="relative flex-1 flex flex-col justify-center py-12">
          <h2 className="font-heading font-bold text-4xl text-white tracking-tight leading-[1.1] mb-5 animate-fade-in-up">
            Your career journey starts here
          </h2>
          <p className="text-primary-100 leading-relaxed text-base mb-8 max-w-sm animate-fade-in-up">
            Create your free account and let AI match you with the internship that fits your skills and goals.
          </p>
          <div className="grid grid-cols-2 gap-4 stagger-children">
            {[
              { icon: GraduationCap, title: 'Students', desc: 'Upload resume, get AI-matched' },
              { icon: Briefcase, title: 'Employers', desc: 'Post roles, find top talent' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/15 transition-colors duration-200">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-primary-200" />
                </div>
                <div className="font-heading font-semibold text-white text-sm">{title}</div>
                <div className="text-xs text-primary-200 mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="lg:hidden flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
              <img src="/internmatch-logo.png" alt="" className="w-9 h-9 object-contain select-none" draggable={false} />
              <span className="font-heading font-bold text-lg text-surface-900 dark:text-white tracking-tight">
                Intern<span className="text-primary-600 dark:text-primary-400">Match</span>
              </span>
            </Link>
          </div>
          <button onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
            aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start px-6 sm:px-10 lg:px-14 py-6">
          <div className="w-full max-w-xl">
            {/* Heading */}
            <div className="mb-7 animate-fade-in-up">
              <h1 className="font-heading font-bold text-3xl text-surface-950 dark:text-white tracking-tight mb-2">
                Create your account
              </h1>
            </div>

            {/* Form with border */}
            <div className="border border-surface-200 dark:border-surface-700 rounded-2xl p-6 sm:p-8">
              {/* Role toggle tabs */}
              <div className="flex gap-1 p-1.5 bg-surface-100 dark:bg-surface-800/60 rounded-xl mb-7 animate-fade-in-up">
                {[
                  { key: 'student', label: 'Student', icon: GraduationCap },
                  { key: 'employer', label: 'Employer', icon: Building2 },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 ${
                      activeTab === key
                        ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-300 shadow-card'
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'student' ? (
                <StudentForm onSuccess={handleSuccess} />
              ) : (
                <EmployerForm onSuccess={handleSuccess} />
              )}
            </div>

            {/* Already have an account - at the bottom */}
            <div className="mt-6 text-center animate-fade-in-up">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline cursor-pointer">
                  Sign in
                </Link>
              </p>
            </div>
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
