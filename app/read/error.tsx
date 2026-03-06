"use client";

import { useRouter } from "next/navigation";

export default function Error({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Couldn&apos;t load article
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          {error.message || "The page couldn't be fetched or parsed."}
        </p>
      </div>
      <button
        onClick={() => router.back()}
        className="h-10 px-5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
      >
        Go back
      </button>
    </main>
  );
}
