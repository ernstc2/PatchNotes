"use client";

import { useState } from "react";
import { saveTopics } from "@/features/auth/queries";
import { TOPIC_OPTIONS } from "@/features/feed/options";

// Filter out the 'all' sentinel — only real topics
const SELECTABLE_TOPICS = TOPIC_OPTIONS.filter((t) => t.value !== "all");

export function TopicPicker() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  function toggleTopic(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  async function handleContinue() {
    setLoading(true);
    await saveTopics(Array.from(selected));
    // saveTopics redirects to "/" — no need to handle navigation here
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {SELECTABLE_TOPICS.map((topic) => {
          const isSelected = selected.has(topic.value);
          return (
            <button
              key={topic.value}
              type="button"
              onClick={() => toggleTopic(topic.value)}
              className={
                isSelected
                  ? "rounded-full px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground transition-colors"
                  : "rounded-full px-4 py-1.5 text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              }
            >
              {topic.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving..." : selected.size === 0 ? "Skip for now" : `Follow ${selected.size} topic${selected.size === 1 ? "" : "s"}`}
        </button>
        {selected.size === 0 && (
          <p className="text-xs text-center text-muted-foreground">
            You&apos;ll see all items. You can pick topics anytime.
          </p>
        )}
      </div>
    </div>
  );
}
