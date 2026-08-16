import { cn } from '../../lib/cn';
import { ACCESS_STATUS_LABELS, AccessStatus } from '../../types';
import { Badge } from './Badge';

export function statusVariant(status: AccessStatus | string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status) {
    case 'approved':
    case 'verified':
      return 'success';
    case 'pending':
      return 'warning';
    case 'denied':
    case 'revoked':
    case 'failed':
      return 'danger';
    case 'expired':
      return 'danger';
    default:
      return 'neutral';
  }
}

interface AccessStatusBadgeProps {
  status: AccessStatus;
  className?: string;
}

export function AccessStatusBadge({ status, className }: AccessStatusBadgeProps) {
  return (
    <Badge variant={statusVariant(status)} className={className}>
      {ACCESS_STATUS_LABELS[status] || status}
    </Badge>
  );
}

export { ACCESS_STATUS_LABELS, cn };