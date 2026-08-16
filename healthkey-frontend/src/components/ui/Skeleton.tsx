import { cn } from '../../lib/cn';

export const Spinner = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600', className)}
  />
);

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('animate-pulse rounded-lg bg-ink-100', className)} aria-hidden />
);

export const SkeletonList = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3" role="status" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex animate-pulse items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft"
      >
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    ))}
  </div>
);