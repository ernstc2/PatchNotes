"use client";

import { useOptimistic, useTransition } from "react";
import { X } from "lucide-react";

type TopicOption = {
  value: string;
  label: string;
};

type TopicManagerProps = {
  savedTopics: string[];
  topicOptions: TopicOption[];
  updateTopics: (topics: string[]) => Promise<void>;
};

export function TopicManager({ savedTopics, topicOptions, updateTopics }: TopicManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTopics, setOptimisticTopics] = useOptimistic(savedTopics);

  function handleAdd(value: string) {
    if (optimisticTopics.includes(value)) return;
    const newTopics = [...optimisticTopics, value];

    startTransition(async () => {
      setOptimisticTopics(newTopics);
      await updateTopics(newTopics);
    });
  }

  function handleRemove(value: string) {
    const newTopics = optimisticTopics.filter((t) => t !== value);

    startTransition(async () => {
      setOptimisticTopics(newTopics);
      await updateTopics(newTopics);
    });
  }

  const savedSet = new Set(optimisticTopics);
  const availableToAdd = topicOptions.filter((o) => !savedSet.has(o.value));

  return (
    <div className={isPending ? "opacity-70 pointer-events-none" : ""}>
      {/* Current watched topics */}
      {optimisticTopics.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">
          No topics selected. Add topics below to get a personalized feed.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {optimisticTopics.map((topic) => {
            const label = topicOptions.find((o) => o.value === topic)?.label ?? topic;
            return (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {label}
                <button
                  type="button"
                  onClick={() => handleRemove(topic)}
                  aria-label={`Remove ${label}`}
                  className="rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Topics available to add */}
      {availableToAdd.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
            Add topics
          </p>
          <div className="flex flex-wrap gap-2">
            {availableToAdd.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAdd(option.value)}
                className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
