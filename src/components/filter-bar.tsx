"use client"

import { useRouter, usePathname } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TYPE_OPTIONS, TOPIC_OPTIONS } from '@/features/feed/options';

const SORT_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

type FilterBarProps = {
  activeType?: string;
  activeTopic?: string;
  activeSort?: string;
};

export function FilterBar({ activeType, activeTopic, activeSort }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  function updateFilter(key: 'type' | 'topic' | 'sort', value: string) {
    const actualValue = (key === 'sort') ? value : (value === 'all' ? '' : value);
    const params = new URLSearchParams();

    const currentType = key === 'type' ? actualValue : (activeType ?? '');
    const currentTopic = key === 'topic' ? actualValue : (activeTopic ?? '');
    const currentSort = key === 'sort' ? actualValue : (activeSort ?? '');

    if (currentType) params.set('type', currentType);
    if (currentTopic) params.set('topic', currentTopic);
    if (currentSort && currentSort !== 'desc') params.set('sort', currentSort);

    const query = params.toString();
    router.replace(query ? pathname + '?' + query : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 max-w-2xl mx-auto w-full">
      <Select
        value={activeType ?? 'all'}
        onValueChange={(value) => updateFilter('type', value ?? 'all')}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeTopic ?? 'all'}
        onValueChange={(value) => updateFilter('topic', value ?? 'all')}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TOPIC_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeSort ?? 'desc'}
        onValueChange={(value) => updateFilter('sort', value ?? 'desc')}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
