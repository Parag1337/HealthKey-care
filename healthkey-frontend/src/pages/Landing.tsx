import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ClipboardList,
  Cloud,
  FileCheck2,
  FilePlus2,
  HeartPulse,
  Lock,
  Menu,
  QrCode,
  ScanLine,
  Share2,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  UploadCloud,
  UserRound,
  X,
  Zap
} from 'lucide-react';
import { Logo, LogoMark } from '../components/brand/Logo';
import { Reveal } from '../hooks/useReveal';
import { cn } from '../lib/cn';

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-ink-500">{subtitle}</p>}
    </Reveal>
  );
}

const FEATURES = [
  { icon: QrCode, label: 'QR-Based Access', desc: 'Grant doctors instant access by scanning your unique QR code' },
  { icon: Lock, label: 'Complete Control', desc: 'Revoke access anytime and see full audit trails' },
  { icon: ShieldCheck, label: 'Blockchain Verified', desc: 'Every record update is immutably recorded on blockchain' },
  { icon: BatteryCharging, label: 'Real-Time Monitoring', desc: 'Connect wearables to track vitals continuously' },
  { icon: Zap, label: 'AI Insights', desc: 'Get intelligent health summaries and risk detection' },
  { icon: FileCheck2, label: 'Unified Records', desc: 'All prescriptions, scans, and reports in one secure place' }
];

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#for-patients', label: 'For Patients' },
  { href: '#for-doctors', label: 'For Doctors' },
  { href: '#security', label: 'Security' }
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled ? 'border-ink-200/80 bg-white/90 shadow-soft backdrop-blur' : 'border-transparent bg-white/60 backdrop-blur'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="HealthKey home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Get Started
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 lg:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 border-t border-ink-100 pt-3">
            <Link
              to="/login"
              className="flex-1 rounded-lg border border-ink-200 px-4 py-2.5 text-center text-sm font-medium text-ink-700"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero mockup                                                         */
/* ------------------------------------------------------------------ */

function VitalChip({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">{icon}</span>
      <span>
        <span className="block text-[10px] font-medium uppercase tracking-wide text-ink-400">{label}</span>
        <span className="block text-sm font-semibold text-ink-800">
          {value} <span className="text-[10px] font-normal text-ink-400">{unit}</span>
        </span>
      </span>
    </div>
  );
}

function HeroMockup() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-brand-100/70 via-white to-sky-100/60" />
      <div className="absolute -left-10 top-16 hidden h-40 w-40 rounded-full bg-brand-200/40 blur-2xl lg:block" />
      <div className="absolute -right-8 bottom-10 hidden h-44 w-44 rounded-full bg-sky-200/40 blur-2xl lg:block" />

      <div className="relative space-y-3">
        <div className="animate-float rounded-2xl border border-ink-200/80 bg-white p-4 shadow-lift [animation-delay:0.4s]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-400">Upcoming appointment</span>
              <span className="block text-[15px] font-semibold text-ink-800">Dr. Sharma · Cardiology</span>
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Today · 4:30 PM
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full w-2/3 rounded-full bg-brand-500" />
          </div>
          <p className="mt-1.5 text-[10px] text-ink-400">Appointment confirmed · In-person consultation</p>
        </div>

        <div className="animate-fade-up rounded-2xl border border-ink-200/80 bg-white p-4 shadow-lift [animation-delay:0.15s]">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-800">Health overview</span>
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" /> Synced
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <VitalChip icon={<HeartPulse className="h-4 w-4" />} label="Heart rate" value="76" unit="BPM" />
            <VitalChip icon={<Activity className="h-4 w-4" />} label="SpO₂" value="98" unit="%" />
            <VitalChip icon={<Thermometer className="h-4 w-4" />} label="Temperature" value="36.7" unit="°C" />
          </div>
        </div>

        <div className="animate-float rounded-2xl border border-ink-200/80 bg-white p-4 shadow-lift [animation-delay:0.8s]">
          <span className="mb-2.5 block text-[13px] font-semibold text-ink-800">Recent records</span>
          <div className="space-y-2">
            {[
              { icon: <FileCheck2 className="h-4 w-4" />, title: 'CBC Report', meta: 'Laboratory · 14 Aug', ok: true },
              { icon: <ClipboardList className="h-4 w-4" />, title: 'Prescription', meta: 'Dr. Sharma · 10 Aug', ok: false },
              { icon: <HeartPulse className="h-4 w-4" />, title: 'ECG Report', meta: 'Diagnostic · 5 Aug', ok: true }
            ].map((r) => (
              <div key={r.title} className="flex items-center gap-2.5 rounded-lg bg-ink-50 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-brand-600 shadow-sm">
                  {r.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium text-ink-700">{r.title}</span>
                  <span className="block text-[10px] text-ink-400">{r.meta}</span>
                </span>
                {r.ok && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex animate-fade-up items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 [animation-delay:0.3s]">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
              <Share2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-ink-800">Active consent</span>
              <span className="block text-[11px] text-ink-500">Dr. Sharma · Records &amp; prescriptions</span>
            </span>
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
            Expires 5:30 PM
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landing                                                             */
/* ------------------------------------------------------------------ */

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-ink-800">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Your health data, under your control
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink-800 sm:text-6xl">
                Healthcare that puts <span className="text-brand-600">you</span> in control.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
                Manage your medical records, grant doctors secure QR-based access, monitor your vitals
                with connected devices, and enjoy AI-powered health insights — all on your terms.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  <UserRound className="h-4 w-4" />
                  Patient Sign Up
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-6 py-3.5 text-sm font-semibold text-ink-700 shadow-soft transition-colors hover:border-ink-300 hover:bg-ink-50"
                >
                  <Stethoscope className="h-4 w-4" />
                  Doctor Sign Up
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-500">
                {['Consent-based sharing', 'Integrity verification', 'Full audit trail'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={200} className="lg:pl-8">
            <HeroMockup />
            <p className="mt-4 text-center text-[11px] text-ink-400">
              Illustrative preview of the patient experience.
            </p>
          </Reveal>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-ink-100 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why HealthKey"
            title="Your healthcare, organized in one place."
            subtitle="Everything important about your health — in a single, calm place you control."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <FilePlus2 className="h-5 w-5" />, title: 'Medical records', desc: 'Upload and organize reports, scans, and prescriptions securely.' },
              { icon: <QrCode className="h-5 w-5" />, title: 'QR-based access', desc: 'Share access with doctors by scanning — no forms, instant consent.' },
              { icon: <BatteryCharging className="h-5 w-5" />, title: 'Health monitoring', desc: 'Connect wearables to track vitals continuously in one timeline.' },
              { icon: <Zap className="h-5 w-5" />, title: 'AI insights', desc: 'Get intelligent health summaries and early risk detection.' }
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-ink-100 bg-ink-50/60 p-6 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-soft">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700">
                    {f.icon}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink-800">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Core Features"
            title="Everything you need for complete health control."
            subtitle="Unified platform for managing records, granting access, monitoring vitals, and understanding your health."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.label} delay={i * 80}>
                <div className="h-full rounded-2xl border border-ink-100 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink-800">{f.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-y border-ink-100 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How It Works"
            title="Patient control at every step."
            subtitle="From storing your records to granting doctor access — you're in command."
          />
          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-y-4">
            {['Upload Records', 'Grant Access', 'Set Permissions', 'Track Access'].map((s, i, arr) => (
              <span key={s} className="flex items-center">
                <span className="flex min-w-[128px] flex-col items-center gap-1.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="text-center text-[13px] font-medium text-ink-600">{s}</span>
                </span>
                {i < arr.length - 1 && (
                  <ArrowRight className="mx-3 h-4 w-4 shrink-0 text-ink-300 sm:mx-5" />
                )}
              </span>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mx-auto mt-14 max-w-md rounded-3xl border border-ink-200 bg-gradient-to-b from-white to-ink-50 p-8 text-center shadow-lift">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-600">Consent Confirmed</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-800">Dr. Ananya Sharma</p>
              <p className="text-sm text-ink-500">Cardiology · Verified</p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px]">
                  <span className="text-ink-600">Medical records</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px]">
                  <span className="text-ink-600">Prescriptions</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                <Zap className="h-3.5 w-3.5" /> Expires: 24 hours
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MEDICAL RECORDS */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Medical Records</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                Everything from every provider, in one timeline.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-500">
                Keep your important health records organized, available when you need them, and share them
                with the right people — when you choose.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: <UploadCloud className="h-5 w-5" />, label: 'Upload' },
                  { icon: <ClipboardList className="h-5 w-5" />, label: 'Organize' },
                  { icon: <ShieldCheck className="h-5 w-5" />, label: 'Verify' },
                  { icon: <Share2 className="h-5 w-5" />, label: 'Share' }
                ].map((f) => (
                  <div key={f.label} className="rounded-2xl border border-ink-100 bg-white p-4 text-center shadow-soft">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      {f.icon}
                    </span>
                    <p className="mt-2 text-[13px] font-semibold text-ink-700">{f.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-ink-400">
                Illustrative records. Your actual records appear only after you upload them.
              </p>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="space-y-3">
              {[
                { icon: <FileCheck2 className="h-5 w-5" />, title: 'CBC Report', meta: 'Laboratory Report · 16 Aug 2026', ok: 'Integrity verified' },
                { icon: <HeartPulse className="h-5 w-5" />, title: 'MRI Scan', meta: 'Diagnostic Imaging · 12 Aug 2026', ok: null },
                { icon: <ClipboardList className="h-5 w-5" />, title: 'Prescription', meta: 'Dr. Sharma · 10 Aug 2026', ok: null }
              ].map((r, i) => (
                <div
                  key={r.title}
                  className="flex animate-fade-up items-center gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft [animation-delay:0.05s]"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    {r.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink-800">{r.title}</span>
                    <span className="block text-[13px] text-ink-400">{r.meta}</span>
                  </span>
                  {r.ok && (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> {r.ok}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONSENT */}
      <section className="border-y border-ink-100 bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-md rounded-3xl border border-ink-200 bg-white p-7 shadow-lift">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-ink-800">Dr. Sharma</span>
                  <span className="block text-sm text-ink-500">Cardiology</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" /> Access: Active
                </span>
              </div>

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Allowed to view</p>
              <div className="mt-2 space-y-2">
                {['Medical records', 'Prescriptions', 'Vitals'].map((p) => (
                  <div key={p} className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5">
                    <span className="text-sm text-ink-700">{p}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                <span className="text-sm font-medium text-ink-700">Expires</span>
                <span className="text-sm font-semibold text-amber-700">Today · 5:30 PM</span>
              </div>
              <p className="mt-5 text-xs text-ink-400">
                Who sees what, and for how long — you decide all three.
              </p>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Private by design</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                You decide who sees your health information.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-500">
                HealthKey is built around consent. Nothing is shared automatically — every doctor gets
                access only to what you approve, and every access expires.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-8 space-y-3">
                {[
                  { k: 'WHO', v: 'Choose exactly which doctor can see your information.' },
                  { k: 'WHAT', v: 'Grant records, prescriptions, or vitals — individually.' },
                  { k: 'WHEN', v: 'Set an expiry; access ends automatically at the time you choose.' }
                ].map((r) => (
                  <div key={r.k} className="flex items-start gap-4 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
                    <span className="flex h-8 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-xs font-bold uppercase tracking-wider text-brand-700">
                      {r.k}
                    </span>
                    <p className="text-sm leading-relaxed text-ink-600">{r.v}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* QR CONSENT */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Instant consent"
            title="Share access in seconds — with a QR code."
            subtitle="No forms, no fax. Scan, choose permissions, and the doctor gets authorized access to what you allow."
          />
          <Reveal delay={100}>
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-y-6">
              {['Doctor QR', 'Patient scans', 'Selects permissions', 'Consent created', 'Authorized access'].map((s, i, arr) => (
                <span key={s} className="flex items-center">
                  <span className="flex min-w-[120px] flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        i === 0 ? 'bg-ink-800 text-white' : 'bg-brand-50 text-brand-700'
                      )}
                    >
                      {i === 0 ? <QrCode className="h-5 w-5" /> : <ScanLine className="h-5 w-5" />}
                    </span>
                    <span className="text-center text-[12px] font-medium leading-tight text-ink-600">{s}</span>
                  </span>
                  {i < arr.length - 1 && <ArrowRight className="mx-2 h-4 w-4 shrink-0 text-ink-300 sm:mx-4" />}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="mx-auto mt-14 flex max-w-xl items-center justify-center gap-8 rounded-3xl border border-ink-200 bg-white p-8 shadow-soft">
              <div className="space-y-1.5 rounded-2xl border-4 border-ink-800 bg-white p-4" aria-hidden>
                {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                  <div key={r} className="flex gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((c) => {
                      const on = (r * 7 + c * 3 + ((r + c) % 2) * 2) % 5 < 3;
                      return <span key={c} className={cn('h-2.5 w-2.5 rounded-[3px]', on ? 'bg-ink-800' : 'bg-ink-100')} />;
                    })}
                  </div>
                ))}
              </div>
              <div className="max-w-[220px]">
                <p className="text-sm font-semibold text-ink-800">No personal data in the QR</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                  The code only identifies your doctor. Permissions stay on your device until you confirm.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOR PATIENTS */}
      <section id="for-patients" className="border-y border-ink-100 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="For Patients"
            title="Your medical life, organized and controlled."
            subtitle="Unified access to your records, vitals, permissions, and health insights."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {[
              { icon: <FilePlus2 className="h-5 w-5" />, t: 'Medical records', d: 'Upload, organize, and access all your reports in one place.' },
              { icon: <QrCode className="h-5 w-5" />, t: 'QR-based access', d: 'Share with doctors instantly — just scan and set permissions.' },
              { icon: <ClipboardList className="h-5 w-5" />, t: 'Prescriptions', d: 'Track all medications and follow your doctors instructions.'},
              { icon: <Activity className="h-5 w-5" />, t: 'Connected vitals', d: 'Monitor heart rate, SpO₂, blood pressure from wearables.' },
              { icon: <Share2 className="h-5 w-5" />, t: 'Consent control', d: 'Grant, manage, and revoke doctor access anytime.' },
              { icon: <Zap className="h-5 w-5" />, t: 'AI insights', d: 'Get intelligent health summaries and early alerts.' }
            ].map((f, i) => (
              <Reveal key={f.t} delay={(i % 3) * 90}>
                <div className="h-full rounded-2xl border border-ink-100 p-5 transition-colors hover:border-brand-200 hover:bg-ink-50/40">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{f.icon}</span>
                  <p className="mt-3 text-[15px] font-semibold text-ink-800">{f.t}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120} className="mt-10 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
            >
              Create Patient Account <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FOR DOCTORS */}
      <section id="for-doctors" className="bg-ink-50/70 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">For Doctors</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                Secure, instant access to patient records.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-500">
                Create your profile, get a unique QR code, and let patients grant you access to their
                medical records — no paperwork, no delays, complete audit trail.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  'Professional profile & QR',
                  'Patient record access',
                  'View prescriptions & vitals',
                  'Upload reports securely',
                  'Complete access audit trail',
                  'AI-assisted notes'
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-soft">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={160}>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-ink-800 bg-ink-800 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-ink-700"
              >
                Doctor Sign Up <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <div className="mx-auto max-w-md rounded-3xl border border-ink-200 bg-white p-7 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink-800">Your QR Code</p>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" /> Active
                </span>
              </div>
              <div className="mt-5 flex h-40 items-center justify-center rounded-2xl border-2 border-ink-200 bg-white p-4">
                <div className="space-y-1 rounded-lg border-4 border-ink-800 bg-white p-3" aria-hidden>
                  {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                    <div key={r} className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((c) => {
                        const on = (r * 7 + c * 3 + ((r + c) % 2) * 2) % 5 < 3;
                        return <span key={c} className={cn('h-2 w-2 rounded-[2px]', on ? 'bg-ink-800' : 'bg-ink-100')} />;
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-5 text-xs text-ink-600">
                <strong>Patients scan this.</strong> They authorize access to their medical records.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-[13px]">
                  <span className="text-ink-600">Access Requests</span>
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">3</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-[13px]">
                  <span className="text-ink-600">Active Consents</span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">2</span>
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] text-ink-400">
                Your QR code is unique and patient-safe.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* AI */}
      <section className="border-y border-ink-100 bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Health Insights</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
              Health insights, not diagnoses.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-500">
              HealthKey can surface gentle, useful observations from your recorded trends — so you notice
              changes early and have better conversations with your doctor.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-medium text-amber-700">
              Informational only — not a medical diagnosis.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mx-auto max-w-md rounded-3xl border border-ink-200 bg-gradient-to-b from-white to-ink-50 p-7 shadow-lift">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">AI Health Insight</p>
              <p className="mt-3 font-display text-lg leading-relaxed text-ink-700">
                “Your recent recorded vitals show an increase in average heart rate compared with your
                previous recorded period.”
              </p>
              <div className="mt-5 flex h-14 items-end gap-2 rounded-xl bg-white px-4 py-2.5 shadow-soft">
                {[36, 52, 44, 60, 48, 66, 58, 72, 64, 78].map((h, i) => (
                  <span key={i} className="w-full rounded-sm bg-brand-200" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="mt-4 text-[11px] text-ink-400">Illustrative insight based on sample data.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* IoT */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal delay={120}>
            <div className="mx-auto max-w-md rounded-3xl border border-ink-200 bg-white p-7 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[15px] font-semibold text-ink-800">
                  <BatteryCharging className="h-5 w-5 text-brand-600" />
                  HealthKey connected device
                </p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" /> Connected
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <VitalChip icon={<HeartPulse className="h-4 w-4" />} label="Heart rate" value="78" unit="BPM" />
                <VitalChip icon={<Activity className="h-4 w-4" />} label="SpO₂" value="98" unit="%" />
                <VitalChip icon={<Thermometer className="h-4 w-4" />} label="Temp" value="36.7" unit="°C" />
              </div>
              <p className="mt-4 text-center text-[11px] text-ink-400">Last synced: 10 seconds ago · Illustrative</p>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Connected Monitoring</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-800 sm:text-4xl">
                Your vitals, flowing into your timeline.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-500">
                HealthKey can integrate connected health devices, so your readings appear alongside your
                history. When no device is connected, your vitals stay a manual, private record.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="border-y border-ink-100 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Security"
            title="Security you can understand."
            subtitle="HealthKey protects your information with practical, verifiable safeguards — not vague promises."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {[
              { icon: <Share2 className="h-5 w-5" />, t: 'Consent-based access', d: 'Nothing is shared without your explicit approval.' },
              { icon: <Lock className="h-5 w-5" />, t: 'Role-based authorization', d: 'Patients and doctors see only what their role allows.' },
              { icon: <FileCheck2 className="h-5 w-5" />, t: 'Audit trails', d: 'Every access to your records is logged and reviewable.' },
              { icon: <ShieldCheck className="h-5 w-5" />, t: 'Cryptographic integrity', d: 'Record integrity is verifiable with stored hashes.' }
            ].map((f, i) => (
              <Reveal key={f.t} delay={(i % 2) * 90}>
                <div className="flex h-full gap-4 rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-soft">
                    {f.icon}
                  </span>
                  <span>
                    <p className="text-[15px] font-semibold text-ink-800">{f.t}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{f.d}</p>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Technology"
            title="Quiet technology behind the experience."
            subtitle="We use modern infrastructure where it helps — the product stays calm and human."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Cloud className="h-5 w-5" />, t: 'Cloud', d: 'Reliable storage infrastructure' },
              { icon: <Lock className="h-5 w-5" />, t: 'Blockchain', d: 'Medical record integrity' },
              { icon: <Zap className="h-5 w-5" />, t: 'AI', d: 'Health insights, not diagnoses' },
              { icon: <Activity className="h-5 w-5" />, t: 'IoT', d: 'Connected health monitoring' }
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
                  {f.icon}
                </span>
                <p className="mt-3 text-[15px] font-semibold text-ink-800">{f.t}</p>
                <p className="mt-0.5 text-[13px] text-ink-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-800 py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <LogoMark className="mx-auto h-12 w-12 rounded-2xl bg-white/10" />
            <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Your health. Your records. Your control.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-brand-100">
              Join HealthKey and keep your healthcare where it belongs — with you.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-50"
              >
                Patient Sign Up <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Stethoscope className="h-4 w-4" /> Doctor Sign Up
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
                Manage your medical records, grant secure access to doctors, monitor vitals, and stay in control of your health data.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Product</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#how-it-works" className="text-ink-600 hover:text-brand-700">How It Works</a></li>
                <li><a href="#features" className="text-ink-600 hover:text-brand-700">Features</a></li>
                <li><Link to="/register" className="text-ink-600 hover:text-brand-700">Medical Records</Link></li>
                <li><a href="#for-doctors" className="text-ink-600 hover:text-brand-700">For Doctors</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Company</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-ink-400">About</span></li>
                <li><span className="text-ink-400">Contact</span></li>
                <li><span className="text-ink-400">Help</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Trust</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#security" className="text-ink-600 hover:text-brand-700">Security</a></li>
                <li><span className="text-ink-400">Privacy</span></li>
                <li><span className="text-ink-400">Terms</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 sm:flex-row">
            <p className="text-xs text-ink-400">© {new Date().getFullYear()} HealthKey. All rights reserved.</p>
            <p className="text-xs text-ink-400">Health information should be reviewed with a qualified professional.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}