import { TOPIC_VALUES } from '@/features/summarization/schema';

export const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'executive_order', label: 'Executive Orders' },
  { value: 'bill', label: 'Bills' },
  { value: 'rule', label: 'Regulations' },
  { value: 'proposed_rule', label: 'Proposed Rules' },
];

const TOPIC_LABELS: Record<string, string> = {
  healthcare: 'Healthcare',
  taxes: 'Taxes',
  immigration: 'Immigration',
  environment: 'Environment',
  defense: 'Defense',
  education: 'Education',
  economy: 'Economy',
};

export const TOPIC_OPTIONS = [
  { value: 'all', label: 'All topics' },
  ...TOPIC_VALUES.filter((t) => t !== 'other').map((t) => ({
    value: t,
    label: TOPIC_LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1),
  })),
];
