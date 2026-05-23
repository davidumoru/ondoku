"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let target = url.trim();
    if (!target) return;
    if (!target.match(/^https?:\/\//)) target = "https://" + target;
    startTransition(() => {
      router.push(`/read?url=${encodeURIComponent(target)}`);
    });
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-pixel text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 text-balance">
            ondoku
          </h1>
          <p className="text-muted-foreground text-lg animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both text-balance">
            Read anything, beautifully.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both"
        >
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a URL…"
            required
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            className="flex-1 h-11 rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed transition-[opacity,transform] duration-150 ease-out"
          >
            {pending ? "Loading…" : "Read"}
          </button>
        </form>
      </div>
    </main>
  );
}
