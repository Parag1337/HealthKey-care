import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  CalendarClock,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  QrCode,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  X,
  FileClock,
  Home,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';
import { Logo } from '../brand/Logo';

const patientNav = [
  { to: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/records', label: 'Medical Records', icon: FileText },
  { to: '/dashboard/prescriptions', label: 'Prescriptions', icon: ScrollText },
  { to: '/dashboard/vitals', label: 'Vitals', icon: HeartPulse },
  { to: '/dashboard/connect', label: 'Connect Doctor', icon: QrCode },
  { to: '/dashboard/access', label: 'Access & Consent', icon: ShieldCheck },
  { to: '/dashboard/audit', label: 'Security & Audit', icon: FileClock }
];

const doctorNav = [
  { to: '/doctor/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/requests', label: 'Access Requests', icon: Link2 },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: ScrollText },
  { to: '/doctor/records', label: 'Medical Records', icon: FileText },
  { to: '/doctor/vitals', label: 'Vitals', icon: Activity },
  { to: '/doctor/audit', label: 'Security & Audit', icon: FileClock }
];

const doctorFooterNav = [
  { to: '/doctor/my-qr', label: 'My QR', icon: QrCode },
  { to: '/doctor/profile', label: 'Profile & Availability', icon: UserCog }
];

function NavItems({
  items,
  onNavigate,
  activeClass = 'bg-brand-50 text-brand-700 font-semibold',
  idleClass = 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
}: {
  items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  onNavigate?: () => void;
  activeClass?: string;
  idleClass?: string;
}) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              isActive ? activeClass : idleClass
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const isPatient = user?.role === 'patient';
  const nav = isPatient ? patientNav : doctorNav;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center border-b border-ink-100 px-5 py-5">
        <Link to="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Primary">
        <NavItems items={nav} onNavigate={onNavigate} />
        {!isPatient && (
          <div className="mt-3 border-t border-ink-100 pt-3">
            <NavItems items={doctorFooterNav} onNavigate={onNavigate} />
          </div>
        )}
      </nav>

      <div className="border-t border-ink-100 px-3 py-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink-700">{user?.name}</p>
            <p className="truncate text-[11px] text-ink-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-ink-400 transition-colors hover:bg-ink-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const isPatient = user?.role === 'patient';

  const items = isPatient
    ? [
        { to: '/dashboard/overview', label: 'Home', icon: Home },
        { to: '/dashboard/records', label: 'Records', icon: FileText },
        { to: '/dashboard/connect', label: 'Connect', icon: QrCode },
        { to: '/dashboard/access', label: 'Consent', icon: ShieldCheck },
        { to: '/dashboard/audit', label: 'Audit', icon: FileClock }
      ]
    : [
        { to: '/doctor/overview', label: 'Home', icon: Home },
        { to: '/doctor/appointments', label: 'Appointments', icon: CalendarClock },
        { to: '/doctor/patients', label: 'Patients', icon: Users },
        { to: '/doctor/requests', label: 'Requests', icon: Link2 },
        { to: '/doctor/profile', label: 'Profile', icon: UserCog }
      ];

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex min-w-[58px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors',
                active ? 'text-brand-700' : 'text-ink-400'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-ink-50 text-ink-800">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-ink-200 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-800/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-in border-r border-ink-200 bg-white shadow-lift">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 rounded-md p-1.5 text-ink-400 hover:text-ink-700"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-200/80 bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <Link to="/" aria-label="HealthKey home">
              <Logo compact />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-ink-200 bg-white px-3 py-1 text-[11px] font-medium capitalize text-ink-500 sm:inline">
              {user?.role === 'doctor' ? (user?.specialization || 'Doctor') : 'Patient'}
            </span>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10 lg:pt-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};