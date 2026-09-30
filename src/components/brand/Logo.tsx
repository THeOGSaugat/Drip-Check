import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

/**
 * The drop + check mark. Two tones so it never dissolves into its backdrop:
 * - light (on Ivory): Sapphire→Navy drop, Ivory check.
 * - dark (on the Navy bar): Champagne→Taupe drop, Navy check. A Sapphire drop
 *   would sit at 1.9:1 against Navy and lose its outline.
 * Each tone has its own gradient id: the header and the mobile menu can both
 * be mounted at once, and a shared id would make one silently borrow the
 * other's colours.
 */
export function DripMark({ className, tone = "light" }: { className?: string; tone?: Tone }) {
  const gradId = tone === "dark" ? "dripcheck-mark-dark" : "dripcheck-mark-light";
  const [from, to] =
    tone === "dark" ? ["var(--champagne)", "var(--taupe)"] : ["var(--sapphire)", "var(--navy)"];

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7", className)} fill="none">
      <path
        d="M16 2c3.4 4.6 9 8.4 9 15a9 9 0 1 1-18 0c0-6.6 5.6-10.4 9-15Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="m11.8 17.4 3.1 3.2 5.6-6"
        stroke={tone === "dark" ? "var(--navy)" : "var(--ivory)"}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={gradId} x1="7" y1="2" x2="25" y2="26">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  className,
  compact,
  onDark,
}: {
  className?: string;
  compact?: boolean;
  /** Placed on the Navy bar: Ivory "Drip", Champagne "Check", Champagne mark. */
  onDark?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn(
        "relative z-10 flex items-center gap-2 rounded-md transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4",
        onDark ? "focus-visible:outline-champagne" : "focus-visible:outline-sapphire",
        className,
      )}
    >
      <DripMark tone={onDark ? "dark" : "light"} />
      {!compact && (
        <span
          className={cn(
            "font-display text-xl font-extrabold tracking-tight",
            onDark ? "text-ivory" : "text-navy",
          )}
        >
          Drip<span className={onDark ? "text-champagne" : "text-sapphire"}>Check</span>
        </span>
      )}
    </Link>
  );
}
