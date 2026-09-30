import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/drip/PageHeader";
import { useDailyLeaderboard } from "@/hooks/use-daily-leaderboard";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Daily Leaderboard — DripCheck" },
      {
        name: "description",
        content:
          "See today's highest Drip Scores from the DripCheck Rating Game and how your fit stacks up.",
      },
      { property: "og:title", content: "Daily Leaderboard — DripCheck" },
      { property: "og:description", content: "Today's highest scoring fits." },
    ],
  }),
  component: LeaderboardPage,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
  // Rating Game results only — personal Live / Photo checks never save scores.
  const { data, isLoading } = useDailyLeaderboard();
  const entries = data?.entries ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="Leaderboard"
        title="Today's Drip"
        subtitle="Only Rating Game results count. Rankings reset at midnight."
      />

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="drip-card flex flex-col items-center gap-4 rounded-3xl p-12 text-center">
          <Camera className="h-6 w-6 text-accent" />
          <p className="max-w-sm text-sm text-muted-foreground">
            No scores yet today. The board fills up as people play the Rating Game — be the
            first one on it.
          </p>
          <Link to="/rating-game" className="drip-btn-primary">
            Play the Rating Game
          </Link>
        </div>
      )}

      {podium.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
          {podium.map((entry, i) => (
            <div
              key={entry.id}
              className={cn(
                "drip-card relative flex flex-col items-center gap-2 overflow-hidden rounded-3xl p-6 text-center",
                i === 0 && "sm:order-2 sm:-translate-y-3 border-accent/40 shadow-lg",
                i === 1 && "sm:order-1",
                i === 2 && "sm:order-3",
              )}
            >
              {i === 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_70%)] opacity-[0.12]"
                />
              )}
              <span className="text-3xl leading-none">{MEDALS[i]}</span>
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full bg-sand font-display font-bold uppercase text-accent",
                  i === 0 ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm",
                )}
              >
                {entry.displayName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{entry.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  @{entry.username} · {entry.styleLabel}
                </p>
              </div>
              <span
                className={cn(
                  "font-display font-extrabold text-accent",
                  i === 0 ? "text-3xl" : "text-2xl",
                )}
              >
                {entry.dripScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <ol className="space-y-3">
          {rest.map((entry) => (
            <li
              key={entry.id}
              className="drip-card flex items-center gap-4 rounded-2xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
            >
              <span className="w-8 text-center font-display text-lg font-bold text-muted-foreground">
                {entry.rank}
              </span>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand font-display text-sm font-bold uppercase text-accent">
                {entry.displayName.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{entry.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  @{entry.username} · {entry.styleLabel}
                </p>
              </div>
              <span className="font-display text-2xl font-extrabold text-accent">
                {entry.dripScore.toFixed(1)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}