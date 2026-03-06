"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let target = url.trim();
    if (!target) return;
    if (!target.match(/^https?:\/\//)) target = "https://" + target;
    router.push(`/read?url=${encodeURIComponent(target)}`);
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-pixel text-foreground">
            ondoku
          </h1>
          <p className="text-muted-foreground text-lg">
            Read anything, beautifully.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a URL…"
            autoFocus
            className="flex-1 h-11 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Read
          </button>
        </form>
      </div>
    </main>
  );
}
