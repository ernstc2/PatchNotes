import { Badge } from '@/components/ui/badge';

type TypeBadgeProps = {
  type: string;
};

const typeLabels: Record<string, string> = {
  executive_order: 'Executive Order',
  bill: 'Bill',
  rule: 'Regulation',
  proposed_rule: 'Proposed Rule',
};

function capitalizeType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const label = typeLabels[type] ?? capitalizeType(type);
  return <Badge variant="outline">{label}</Badge>;
}
