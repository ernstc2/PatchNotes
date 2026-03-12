import { Badge } from '@/components/ui/badge';
import type { SummaryOutput } from '@/features/feed/types';

type SeverityBadgeProps = {
  severity: SummaryOutput['severity'];
};

const severityConfig: Record<
  SummaryOutput['severity'],
  { variant: 'destructive' | 'secondary' | 'outline'; label: string }
> = {
  broad_national: { variant: 'destructive', label: 'National Impact' },
  moderate_regional: { variant: 'secondary', label: 'Regional Impact' },
  narrow_administrative: { variant: 'outline', label: 'Administrative' },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { variant, label } = severityConfig[severity];
  return <Badge variant={variant}>{label}</Badge>;
}
