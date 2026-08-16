import { cn } from '../../lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm',
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M12 4.5v15M4.5 12h15" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      </svg>
    </span>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-ink-800">
        HealthKey
        {!compact && <span className="ml-1.5 hidden text-[11px] font-medium uppercase tracking-widest text-brand-600 sm:inline">Care</span>}
      </span>
    </span>
  );
}