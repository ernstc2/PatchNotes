import type { PolicyItem } from '@/lib/db/schema/items';

export function buildPrompt(item: PolicyItem): string {
  return `You are a nonpartisan government policy analyst. Summarize the following government action for an everyday American who wants to understand what changed and how it affects them. Use plain language. Do not editorialize or include political framing.

Type: ${item.type}
Title: ${item.title}
Date: ${item.date.toISOString().slice(0, 10)}
Status: ${item.status ?? 'N/A'}
Source: ${item.sourceUrl}

Return a JSON object matching the provided schema exactly.`;
}
