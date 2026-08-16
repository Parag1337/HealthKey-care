import React from 'react';
import { Inbox, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
    <div className="text-ink-300">{icon || <Inbox className="h-8 w-8" />}</div>
    <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
    {description && <p className="max-w-sm text-[13px] leading-relaxed text-ink-400">{description}</p>}
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" className="mt-2" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/60 px-6 py-10 text-center"
  >
    <AlertTriangle className="h-7 w-7 text-red-400" />
    <h3 className="text-sm font-semibold text-red-700">{title}</h3>
    <p className="max-w-md text-[13px] leading-relaxed text-ink-500">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);