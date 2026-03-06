export default function Loading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-50 h-13 border-b border-border bg-background/90 backdrop-blur-md" />
      <div className="max-w-[68ch] mx-auto px-6 py-10 space-y-6">
        <div className="space-y-3">
          <div className="h-8 w-3/4 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-1/2 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="h-4 w-40 rounded-md bg-muted animate-pulse" />
        <div className="space-y-3 pt-4">
          {[95, 100, 88, 100, 92, 100, 85, 100, 90, 100, 78, 60].map((w, i) => (
            <div
              key={i}
              className="h-4 rounded-md bg-muted animate-pulse"
              style={{ width: `${w}%`, opacity: 1 - i * 0.04 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
