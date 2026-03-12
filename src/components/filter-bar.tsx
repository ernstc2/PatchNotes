"use client"

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const shouldClear = (key === 'sort' && value === 'desc') || (key !== 'sort' && value === 'all');
    if (shouldClear) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 max-w-2xl mx-auto w-full">
      <Select
        value={activeType || undefined}
        onValueChange={(value) => updateFilter('type', value ?? 'all')}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Type" />
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
        value={activeTopic || undefined}
        onValueChange={(value) => updateFilter('topic', value ?? 'all')}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Topic" />
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
        value={activeSort || undefined}
        onValueChange={(value) => updateFilter('sort', value ?? 'desc')}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Sort" />
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
