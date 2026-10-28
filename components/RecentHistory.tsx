"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
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
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Recent
        </h2>
        <button
          type="button"
          onClick={clearHistory}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Clear
        </button>
      </div>

      <ul className="space-y-1.5">
        {visibleHistory.map((item) => (
          <li
            key={item.url}
            className="flex items-center rounded-lg border border-border bg-card transition-colors hover:bg-muted/55"
          >
            <Link
              href={readPath(item.url)}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-2.5 pl-3 pr-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50"
            >
              {item.favicon ? (
                <Image
                  src={item.favicon}
                  alt=""
                  width={14}
                  height={14}
                  unoptimized
                  className="size-3.5 shrink-0 rounded-sm"
                />
              ) : (
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  <span className="size-1.5 rounded-full bg-muted-foreground/55" />
                </span>
              )}
              <span className="truncate text-foreground">{item.title}</span>
              {item.domain && (
                <span className="max-w-[40%] shrink-0 truncate text-muted-foreground">
                  {item.domain}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => removeHistoryItem(item.url)}
              className="mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[background,color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/50"
              aria-label={`Remove ${item.title} from recent history`}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
