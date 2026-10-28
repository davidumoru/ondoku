"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import {
  clearHistory,
  EMPTY_HISTORY,
  historyStore,
  removeHistoryItem,
} from "@/lib/history";
import { readPath } from "@/lib/site";

function getServerSnapshot() {
  return EMPTY_HISTORY;
}

function formatRelativeTime(value: number): string {
  const diff = Date.now() - value;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(value);
}

export function RecentHistory() {
  const history = useSyncExternalStore(
    historyStore.subscribe,
    historyStore.read,
    getServerSnapshot,
  );
  const visibleHistory = history.slice(0, 5);

  if (visibleHistory.length === 0) return null;

  return (
    <section
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both"
      aria-label="Recent articles"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Recent
        </h2>
        <button
          type="button"
          onClick={clearHistory}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Clear
        </button>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {visibleHistory.map((item) => (
          <div key={item.url} className="group grid grid-cols-[1fr_auto]">
            <Link
              href={readPath(item.url)}
              className="min-w-0 px-3 py-3 text-left transition-colors hover:bg-muted/55 focus-visible:bg-muted focus-visible:outline-none"
            >
              <span className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                  {item.favicon ? (
                    <Image
                      src={item.favicon}
                      alt=""
                      width={16}
                      height={16}
                      unoptimized
                      className="h-4 w-4"
                    />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/55" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {item.domain && (
                      <span className="truncate">{item.domain}</span>
                    )}
                    {item.domain && <span aria-hidden="true">·</span>}
                    <span className="shrink-0">
                      {formatRelativeTime(item.readAt)}
                    </span>
                  </span>
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-1 pr-2">
              <Link
                href={readPath(item.url)}
                tabIndex={-1}
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-[opacity,background,color,transform] duration-150 hover:bg-muted hover:text-foreground hover:opacity-100 active:scale-[0.96] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
              </Link>
              <button
                type="button"
                onClick={() => removeHistoryItem(item.url)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-60 transition-[opacity,background,color,transform] duration-150 hover:bg-muted hover:text-foreground hover:opacity-100 active:scale-[0.96] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50"
                aria-label={`Remove ${item.title} from recent history`}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
