'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TYPE_OPTIONS, TOPIC_OPTIONS } from '@/features/feed/options';

type SearchFilterBarProps = {
  activeType?: string;
  activeTopic?: string;
};

export function SearchFilterBar({ activeType, activeTopic }: SearchFilterBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
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
    </div>
  );
}
