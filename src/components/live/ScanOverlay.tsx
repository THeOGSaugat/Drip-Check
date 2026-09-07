export function ScanOverlay({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <div className="drip-scan-sweep" />
      <div className="drip-scan-grid" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-6">
        <span className="drip-chip border-accent/40 bg-background/70 font-display text-xs uppercase tracking-[0.3em] text-accent">
          {label}
        </span>
      </div>
    </div>
  );
}

export function CameraFrame() {
  const corner = "absolute h-10 w-10 border-accent/70 transition-opacity duration-500";
  return (
    <div className="pointer-events-none absolute inset-0 rounded-3xl">
      <span className={`${corner} left-4 top-4 rounded-tl-2xl border-l-2 border-t-2`} />
      <span className={`${corner} right-4 top-4 rounded-tr-2xl border-r-2 border-t-2`} />
      <span className={`${corner} bottom-4 left-4 rounded-bl-2xl border-b-2 border-l-2`} />
      <span className={`${corner} bottom-4 right-4 rounded-br-2xl border-b-2 border-r-2`} />
    </div>
  );
}

/** Full-body silhouette guide so people know where to stand. */
export function BodyGuide({ message }: { message?: string | undefined }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 120 260"
        className="h-[82%] w-auto opacity-45"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="6 8"
      >
        <circle cx="60" cy="26" r="18" />
        <path d="M60 44v70" />
        <path d="M60 56 28 84M60 56l32 28" />
        <path d="M36 114h48" />
        <path d="M46 114l-6 96M74 114l6 96" />
        <path d="M32 214h18M70 214h18" />
      </svg>
      <p className="mt-3 rounded-full border border-border bg-background/75 px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
        {message ?? "Stand back — head to shoes in frame"}
      </p>
    </div>
  );
}
