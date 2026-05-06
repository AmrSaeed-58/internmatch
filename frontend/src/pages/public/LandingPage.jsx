import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  BrainCircuit,
  Target,
  Users,
  Building2,
  Sun,
  Moon,
  Menu,
  X,
  Upload,
  Search,
  TrendingUp,
  Rocket,
  Heart,
  Zap,
  Shield,
  BarChart3,
  GraduationCap,
  Globe,
  CheckCircle2,
  Mail,
  Briefcase,
  Star,
  BookOpen,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

function ParticlesField({ count = 40 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: 5 + Math.random() * 8,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.1,
    })), [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary-400/30 dark:bg-primary-400/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2.5, p.opacity],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function MorphBlob({ className, color, size = 400, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, delay, ease: [0.23, 0.86, 0.39, 0.96] }}
      className={`absolute pointer-events-none ${className}`}
    >
      <div
        className={`${color} blur-3xl animate-morph`}
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const num = parseInt(value.replace(/[^0-9]/g, ''));
    const duration = 1500;
    const steps = 40;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setCount(num);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled
          ? 'glass-surface shadow-[0_1px_20px_rgba(140,30,128,0.06)] dark:shadow-[0_1px_20px_rgba(140,30,128,0.1)] border-b border-primary-100/40 dark:border-primary-900/20'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between h-20">
          {/* Logo - far left, bigger */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <motion.img
              whileHover={{ rotate: 10, scale: 1.1 }}
              src="/internmatch-logo.png"
              alt=""
              className="w-11 h-11 object-contain select-none"
              draggable={false}
            />
            <span className="font-heading font-bold text-xl text-surface-900 dark:text-white tracking-tight">
              Intern<span className="text-gradient-primary">Match</span>
            </span>
          </Link>

          {/* Nav links - center */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {['Features', 'How It Works', 'For Employers'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="relative text-base font-semibold text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Right side - Sign In + Get Started far right */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9, rotate: 180 }}
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-surface-500 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="px-5 py-2.5 text-base font-bold text-surface-700 dark:text-surface-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 rounded-xl">
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="px-6 py-3 text-base font-bold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl transition-colors duration-200 shadow-glow-sm hover:shadow-glow-md inline-block">
                  Get Started
                </Link>
              </motion.div>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden overflow-hidden border-t border-surface-200 dark:border-surface-700"
            >
              <div className="py-4 space-y-1">
                {['Features', 'How It Works', 'For Employers'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMobileOpen(false)} className="block px-3 py-3 rounded-xl text-base font-semibold text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                    {item}
                  </a>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <Link to="/login" className="block text-center px-4 py-3 text-base font-bold text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-600 rounded-xl">Sign In</Link>
                  <Link to="/register" className="block text-center px-4 py-3 text-base font-bold bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl">Get Started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const words = useMemo(() => ['Dream', 'Perfect', 'Ideal', 'Next'], []);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setWordIndex((i) => (i + 1) % words.length), 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Morphing blobs */}
      <MorphBlob className="top-[-15%] right-[-10%]" size={700} color="bg-primary-300/25 dark:bg-primary-700/15" delay={0} />
      <MorphBlob className="bottom-[-20%] left-[-15%]" size={600} color="bg-accent-300/20 dark:bg-accent-700/10" delay={0.3} />
      <MorphBlob className="top-[40%] left-[10%]" size={300} color="bg-pink-200/20 dark:bg-pink-800/10" delay={0.6} />

      {/* Floating particles */}
      <ParticlesField count={50} />

      <motion.div style={{ y, opacity }} className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-14 lg:py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left - Text content */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-50/80 dark:bg-primary-900/30 border border-primary-200/60 dark:border-primary-800/40 text-primary-700 dark:text-primary-300 text-base font-semibold mb-8"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={18} className="text-accent-500" />
              </motion.div>
              AI-Powered Matching
            </motion.div>

            {/* Headline with rotating word */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
              className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-surface-950 dark:text-white tracking-tight leading-[1.08] mb-5"
            >
              Land Your{' '}
              <span className="relative inline-block min-w-[180px] sm:min-w-[220px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[wordIndex]}
                    initial={{ y: 30, opacity: 0, rotateX: -40 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -30, opacity: 0, rotateX: 40 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block text-gradient-primary"
                  >
                    {words[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <br />
              Internship
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="font-body text-base sm:text-lg text-surface-600 dark:text-surface-300 leading-relaxed max-w-xl mb-7"
            >
              InternMatch reads your resume and profile and matches you with internships that actually fit, instead of dumping a thousand listings on you.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/register"
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 hover:from-primary-700 hover:via-primary-600 hover:to-accent-600 text-white font-bold text-base rounded-xl shadow-glow-md hover:shadow-glow-lg transition-colors duration-300"
                >
                  Start Your Journey
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300 ease-spring" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-6 py-3 border-2 border-primary-200 dark:border-primary-700 text-surface-700 dark:text-surface-200 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-base rounded-2xl transition-colors duration-300 bg-white dark:bg-dark-card"
                >
                  I Have an Account
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right - Hero Image / Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Background glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-accent-400/20 dark:from-primary-600/10 dark:to-accent-600/10 rounded-3xl blur-2xl scale-105" />

              {/* Main hero image */}
              <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-primary-100/30 dark:border-primary-800/20">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                  alt="AI-powered internship matching"
                  className="w-full h-auto object-cover mix-blend-multiply dark:mix-blend-normal"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 via-transparent to-transparent" />
              </div>

              {/* Floating stat cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-6 top-1/4 bg-white dark:bg-dark-card rounded-2xl shadow-elevated p-4 border border-primary-100/40 dark:border-primary-800/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Target size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-surface-900 dark:text-white">95% Match</div>
                    <div className="text-xs text-surface-500">Average accuracy</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -right-4 bottom-1/4 bg-white dark:bg-dark-card rounded-2xl shadow-elevated p-4 border border-primary-100/40 dark:border-primary-800/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Briefcase size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-surface-900 dark:text-white">500+ Jobs</div>
                    <div className="text-xs text-surface-500">Active listings</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-14 grid grid-cols-3 gap-6 max-w-xl mx-auto"
        >
          {[
            { value: '10000', suffix: '+', label: 'Students', icon: Users },
            { value: '500', suffix: '+', label: 'Companies', icon: Building2 },
            { value: '95', suffix: '%', label: 'Match Rate', icon: Target },
          ].map(({ value, suffix, label, icon: Icon }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-center p-5 rounded-2xl bg-white/80 dark:bg-dark-card border border-primary-100/30 dark:border-primary-800/20 shadow-sm hover:shadow-card-hover transition-shadow duration-200"
            >
              <Icon size={24} className="text-primary-500 mx-auto mb-2" />
              <div className="font-heading font-bold text-xl sm:text-2xl text-surface-900 dark:text-white">
                <AnimatedCounter value={value} suffix={suffix} />
              </div>
              <div className="text-sm text-surface-500 dark:text-surface-400 font-semibold mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const features = [
    {
      icon: Upload, title: 'Upload Your Resume',
      description: 'We extract your skills from your resume. You review the list and edit anything you want before saving it.',
      gradient: 'from-primary-500 to-primary-600', bg: 'bg-primary-50 dark:bg-primary-950/30',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
    },
    {
      icon: BrainCircuit, title: 'Smart Matching',
      description: 'Hybrid scoring combines skill analysis, semantic embeddings, and profile data for precise matches.',
      gradient: 'from-accent-500 to-accent-600', bg: 'bg-accent-50 dark:bg-accent-950/30',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    },
    {
      icon: Search, title: 'Semantic Search',
      description: 'Search by meaning, not just keywords. Our AI understands context and finds hidden opportunities.',
      gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-950/30',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    },
    {
      icon: TrendingUp, title: 'Track & Grow',
      description: 'Monitor applications, get recommendations, and build your professional profile over time.',
      gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-950/30',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section id="features" ref={ref} className="relative py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <MorphBlob className="top-[10%] right-[-5%]" size={350} color="bg-primary-200/20 dark:bg-primary-800/10" delay={0} />
      </div>

      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-base font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4 block">How It Works</span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-surface-900 dark:text-white tracking-tight mb-6">
            From resume to dream role in <span className="text-gradient-primary">4 steps</span>
          </h2>
          <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">No more endless scrolling. Let AI do the heavy lifting.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.12, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -6, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              className={`group relative rounded-3xl overflow-hidden ${feature.bg} border border-surface-200 dark:border-surface-700/30 cursor-default`}
            >
              {/* Image at top */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 text-4xl font-heading font-bold text-white/30 select-none">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Content below */}
              <div className="p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-colors duration-500" />

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}
                  >
                    <feature.icon size={26} className="text-white" />
                  </motion.div>
                  <h3 className="font-heading font-bold text-xl text-surface-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const reasons = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Get matched in seconds, not hours of searching.' },
    { icon: Shield, title: 'Privacy First', desc: 'Your data stays yours. Always secure.' },
    { icon: Heart, title: 'Human-Centered', desc: 'AI assists, you decide your path.' },
    { icon: BarChart3, title: 'Data-Driven', desc: 'Real scores, real analysis, real results.' },
    { icon: Globe, title: 'All Industries', desc: 'From tech to healthcare and everything in between.' },
    { icon: GraduationCap, title: 'Student-First', desc: 'Built specifically for your journey.' },
  ];

  return (
    <section id="how-it-works" ref={ref} className="relative py-20 lg:py-24">
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <span className="text-base font-bold text-accent-600 dark:text-accent-400 uppercase tracking-widest mb-4 block">Why InternMatch</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-surface-900 dark:text-white tracking-tight mb-6">
              Not just another <span className="text-gradient-warm">job board</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400 leading-relaxed mb-8">
              Most job boards make you sift through thousands of listings. We rank what's actually relevant to your skills and degree, so the top of the page is the part worth reading.
            </p>

            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden mb-8 shadow-elevated">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
                alt="InternMatch platform"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-transparent to-accent-900/20" />
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white font-bold text-lg rounded-xl shadow-glow-sm hover:shadow-glow-md transition-colors duration-300"
              >
                Join 10,000+ Students
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-2 gap-5">
            {reasons.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
                whileHover={{ scale: 1.05, y: -4, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-primary-100/30 dark:border-primary-800/20 hover:shadow-card-hover transition-shadow duration-200 cursor-default"
              >
                <motion.div whileHover={{ rotate: 15 }} transition={{ type: 'spring' }}>
                  <item.icon size={28} className="text-primary-500 mb-3" />
                </motion.div>
                <h3 className="font-heading font-bold text-lg text-surface-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-base text-surface-500 dark:text-surface-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const testimonials = [
    {
      name: 'Sarah Al-Khalidi',
      role: 'Computer Science Student',
      university: 'University of Jordan',
      quote: 'InternMatch found me a perfect fit at a top tech company. The AI matching saved me weeks of searching!',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
    {
      name: 'Ahmad Hassan',
      role: 'Business Administration',
      university: 'PSUT',
      quote: "I typed what I was looking for in plain English and the right internships came up. That alone saved me hours.",
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
    {
      name: 'Lina Mansour',
      role: 'HR Manager',
      university: 'TechCorp Jordan',
      quote: 'As an employer, the AI-ranked candidates save us hours of screening. We found amazing interns in days, not weeks.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
  ];

  return (
    <section className="relative py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-50/30 to-transparent dark:via-primary-950/10" />

      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="text-base font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4 block">Testimonials</span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-surface-900 dark:text-white tracking-tight mb-6">
            Loved by <span className="text-gradient-primary">students & employers</span>
          </h2>
          <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">See what our community has to say about their experience.</p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-primary-100/30 dark:border-primary-800/20 shadow-sm hover:shadow-card-hover transition-shadow duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} size={20} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              <p className="text-lg text-surface-700 dark:text-surface-200 leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary-200 dark:border-primary-700"
                />
                <div>
                  <div className="font-heading font-bold text-base text-surface-900 dark:text-white">{t.name}</div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">{t.role}</div>
                  <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">{t.university}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmployersSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="for-employers" ref={ref} className="relative py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary-50/50 via-transparent to-accent-50/30 dark:from-primary-950/20 dark:to-accent-950/10" />

      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative"
          >
            <div className="relative w-full max-w-md mx-auto">
              <motion.div
                animate={{ rotate: [2, 4, 2], y: [0, -3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 left-4 right-4 h-48 rounded-2xl bg-accent-100 dark:bg-accent-900/30 border border-accent-200/50 dark:border-accent-800/30"
              />
              <motion.div
                animate={{ rotate: [-1, -3, -1], y: [0, -2, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-2 left-2 right-2 h-48 rounded-2xl bg-primary-100 dark:bg-primary-900/30 border border-primary-200/50 dark:border-primary-800/30"
              />
              <div className="relative rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-surface-800 shadow-elevated p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
                    <Building2 size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-lg text-surface-900 dark:text-white">TechCorp</div>
                    <div className="text-sm text-surface-400">Software Engineering Intern</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Sarah M.', score: 96, color: 'bg-primary-500' },
                    { name: 'James K.', score: 91, color: 'bg-primary-400' },
                    { name: 'Aisha R.', score: 87, color: 'bg-accent-500' },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-300">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base font-semibold text-surface-700 dark:text-surface-200">{c.name}</span>
                          <span className="text-base font-bold text-primary-600 dark:text-primary-400">{c.score}%</span>
                        </div>
                        <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={isInView ? { width: `${c.score}%` } : {}}
                            transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                            className={`h-full ${c.color} rounded-full`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <span className="text-base font-bold text-accent-600 dark:text-accent-400 uppercase tracking-widest mb-4 block">For Employers</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-surface-900 dark:text-white tracking-tight mb-6">
              Find candidates who <span className="text-gradient-warm">actually fit</span>
            </h2>
            <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400 leading-relaxed mb-8">
              Stop sifting through hundreds of unqualified applicants. Our AI pre-scores every candidate so you see the best matches first.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'AI-ranked candidates by match score',
                'Skill-by-skill compatibility breakdown',
                'One-click post, auto-close at deadline',
                'Real-time analytics on every listing',
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 size={22} className="text-accent-500 flex-shrink-0" />
                  <span className="text-lg text-surface-700 dark:text-surface-300 font-semibold">{item}</span>
                </motion.div>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold text-lg rounded-xl shadow-glow-accent transition-colors duration-300">
                Post Your First Internship
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-20 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-900 dark:via-dark-bg dark:to-dark-bg" />
      <MorphBlob className="top-[-10%] right-[-5%]" size={400} color="bg-accent-400/15" delay={0} />
      <MorphBlob className="bottom-[-15%] left-[-10%]" size={350} color="bg-pink-400/10" delay={0.3} />
      <ParticlesField count={25} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.h2
            className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight mb-7"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to find where you belong?
          </motion.h2>
          <p className="text-lg sm:text-xl text-primary-100/80 leading-relaxed max-w-2xl mx-auto mb-10">
            Join thousands of students and employers already using InternMatch to build the future of hiring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="group flex items-center gap-2 px-10 py-5 bg-white text-primary-700 hover:bg-primary-50 font-bold text-lg rounded-xl shadow-floating transition-colors duration-300">
                Create Free Account
                <Rocket size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/login" className="flex items-center gap-2 px-10 py-5 border-2 border-white/30 text-white hover:border-white/60 font-bold text-lg rounded-2xl transition-colors duration-300">
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const footerLinks = {
    'For Students': [
      { label: 'Browse Internships', to: '/login' },
      { label: 'Upload Resume', to: '/register' },
      { label: 'AI Matching', to: '/register' },
      { label: 'Track Applications', to: '/register' },
    ],
    'For Employers': [
      { label: 'Post Internship', to: '/register' },
      { label: 'Find Candidates', to: '/register' },
      { label: 'AI Screening', to: '/register' },
      { label: 'Analytics', to: '/register' },
    ],
    'Company': [
      { label: 'About Us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ],
  };

  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-dark-card">
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/internmatch-logo.png" alt="" className="w-11 h-11 object-contain select-none" draggable={false} />
              <span className="font-heading font-bold text-2xl text-surface-900 dark:text-white">
                Intern<span className="text-gradient-primary">Match</span>
              </span>
            </div>
            <p className="text-base text-surface-500 dark:text-surface-400 leading-relaxed mb-6 max-w-sm">
              AI-powered internship matching platform connecting students with their dream opportunities. Built with advanced matching algorithms to find where you truly belong.
            </p>
            <div className="flex items-center gap-4 text-surface-400">
              <a
                href="mailto:internmatch@psut.edu.jo"
                aria-label="Email InternMatch"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                <Mail size={22} />
              </a>
              <a
                href="https://www.psut.edu.jo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PSUT website"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                <Globe size={22} />
              </a>
              <a
                href="#features"
                aria-label="Learn more"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                <BookOpen size={22} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-heading font-bold text-base text-surface-900 dark:text-white mb-5">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-base text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-base text-surface-400 dark:text-surface-500">
            &copy; {new Date().getFullYear()} InternMatch. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-base text-surface-400 dark:text-surface-500">
            <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">Terms</Link>
            <Link to="/contact" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-surface-50 dark:bg-dark-bg font-body">
      <TopBar />
      <HeroSection />
      <FeaturesSection />
      <WhySection />
      <TestimonialsSection />
      <EmployersSection />
      <CTASection />
      <Footer />
    </div>
  );
}
