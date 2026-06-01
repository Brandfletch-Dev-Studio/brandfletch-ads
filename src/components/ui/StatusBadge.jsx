import { cn } from '@/lib/utils';
import { CAMPAIGN_STATUS_CONFIG } from '@/lib/constants';

export default function StatusBadge({ status, className }) {
  const config = CAMPAIGN_STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', config.color, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}