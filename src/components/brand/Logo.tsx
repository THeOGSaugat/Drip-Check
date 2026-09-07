import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function DripMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
      fill="none"
    >
      <path
        d="M16 2c3.4 4.6 9 8.4 9 15a9 9 0 1 1-18 0c0-6.6 5.6-10.4 9-15Z"
        fill="url(#dripGrad)"
      />
      <path
        d="m11.8 17.4 3.1 3.2 5.6-6"
        stroke="var(--drip-ink)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="dripGrad" x1="7" y1="2" x2="25" y2="26">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <DripMark />
      {!compact && (
        <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
          Drip<span className="text-accent">Check</span>
        </span>
      )}
    </Link>
  );
}
