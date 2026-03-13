import type { PolicyItem } from '@/lib/db/schema/items';
import { TOPIC_VALUES } from './schema';

export function buildPrompt(item: PolicyItem): string {
  return `You are a nonpartisan government policy analyst. Summarize the following government action for an everyday American who wants to understand what changed and how it affects them. Use plain language. Do not editorialize or include political framing.

Type: ${item.type}
Title: ${item.title}
Date: ${item.date.toISOString().slice(0, 10)}
Status: ${item.status ?? 'N/A'}
Source: ${item.sourceUrl}

For the "topic" field, you MUST choose exactly one value from this list: ${TOPIC_VALUES.join(', ')}. Choose "other" only if the item clearly does not fit any of the listed categories.

Return a JSON object matching the provided schema exactly.`;
}
