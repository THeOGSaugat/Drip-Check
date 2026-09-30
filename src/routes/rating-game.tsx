import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, RefreshCw, Share2, Sparkles, Trophy, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/drip/PageHeader";
import { ResultPanel } from "@/components/live/ResultPanel";
import { ScanBooth } from "@/components/live/ScanBooth";
import { DAILY_LEADERBOARD_KEY, useDailyLeaderboard } from "@/hooks/use-daily-leaderboard";
import { playRatingGame } from "@/lib/rating-game.functions";
import { getDeviceKey, shareFitResult } from "@/lib/live-client";
import type { FitAnalysis } from "@/lib/live-types";

export const Route = createFileRoute("/rating-game")({
  head: () => ({
    meta: [
      { title: "Rating Game — DripCheck" },
      {
        name: "description",
        content:
          "Enter your name, step in front of the camera and see where your fit lands on today's DripCheck leaderboard.",
      },
      { property: "og:title", content: "Rating Game — DripCheck" },
      { property: "og:description", content: "Step in. Get rated. Take the top spot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RatingGamePage,
});

const MEDALS = ["🥇", "🥈", "🥉"];

type Identity = { displayName: string; username: string };

type Outcome =
  | { analysis: FitAnalysis; saved: true; rank: number | null }
  | { analysis: FitAnalysis; saved: false; saveError: string };

/**
 * The Rating Game is the ONLY competitive feature: name → camera → scan →
 * AI result → score saved (server-side) → leaderboard and home page Top 3.
 */
function RatingGamePage() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const queryClient = useQueryClient();

  const onScan = useCallback(
    async (frames: string[]) => {
      if (!identity) return { ok: false as const, error: "Enter your name first." };
      const res = await playRatingGame({
        data: {
          frames,
          deviceKey: getDeviceKey(),
          displayName: identity.displayName,
          username: identity.username,
          tzOffset: new Date().getTimezoneOffset(),
        },
      });
      if (!res.ok) return { ok: false as const, error: res.error };
      setOutcome(res);
      if (res.saved) void queryClient.invalidateQueries({ queryKey: DAILY_LEADERBOARD_KEY });
      return { ok: true as const };
    },
    [identity, queryClient],
  );

  const nextPlayer = () => {
    setOutcome(null);
    setIdentity(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow="Rating Game"
          title="THE RATING GAME"
          subtitle="Enter your name, turn for the camera, and see where you land on today's board."
        />
        {identity && (
          <button
            className="drip-chip text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent"
            onClick={nextPlayer}
          >
            @{identity.username} · Not you?
          </button>
        )}
      </div>

      {!identity && <IdentityGate onSubmit={setIdentity} />}

      {identity && (
        <ScanBooth
          onScan={onScan}
          stageLabel="Rating Game"
          startLabel="Start Rating"
          idleNote={`Your score goes on today's leaderboard as @${identity.username}. We score the outfit, never the person.`}
          aside={<TodayTopDrip />}
          renderResult={(again) =>
            outcome && (
              <div className="space-y-6">
                {outcome.saved && outcome.rank === 1 && (
                  <p className="drip-rise text-center font-display text-2xl font-extrabold uppercase tracking-[0.2em] text-accent">
                    🔥 New High Score
                  </p>
                )}
                <ResultPanel analysis={outcome.analysis} />
                <RankCard outcome={outcome} identity={identity} />
                <div className="flex flex-wrap gap-3">
                  <button
                    className="drip-btn-ghost"
                    onClick={() =>
                      void shareFitResult(outcome.analysis.dripScore, outcome.analysis.styleLabel)
                    }
                  >
                    <Share2 className="h-4 w-4" /> Share Result
                  </button>
                  <button className="drip-btn-primary" onClick={nextPlayer}>
                    <UserPlus className="h-4 w-4" /> Next Player
                  </button>
                  <button
                    className="drip-btn-ghost"
                    onClick={() => {
                      setOutcome(null);
                      again();
                    }}
                  >
                    <RefreshCw className="h-4 w-4" /> Play Again
                  </button>
                  <Link to="/leaderboard" className="drip-btn-ghost">
                    <Trophy className="h-4 w-4" /> Leaderboard
                  </Link>
                </div>
              </div>
            )
          }
        />
      )}
    </div>
  );
}

function RankCard({ outcome, identity }: { outcome: Outcome; identity: Identity }) {
  if (!outcome.saved) {
    return (
      <section className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {outcome.saveError}
      </section>
    );
  }

  const { rank } = outcome;
  return (
    <section className="drip-card rounded-3xl border-accent/40 p-6 text-center drip-rise">
      {rank !== null && rank <= 3 ? (
        <p className="font-display text-xl font-extrabold uppercase tracking-[0.16em] text-accent">
          🔥 You made today&apos;s Top 3 — {MEDALS[rank - 1]} #{rank}
        </p>
      ) : rank !== null ? (
        <p className="text-sm text-muted-foreground">
          @{identity.username}, you&apos;re currently{" "}
          <span className="font-display text-base font-bold text-foreground">#{rank}</span> today.
          Beat the score and try again.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Saved to today&apos;s leaderboard as @{identity.username}.
        </p>
      )}
    </section>
  );
}

function TodayTopDrip() {
  const { data } = useDailyLeaderboard();
  const entries = data?.entries ?? [];

  return (
    <aside className="drip-card h-fit rounded-3xl p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
        Today&apos;s Top Drip
      </h2>
      <ol className="mt-4 space-y-2">
        {entries.length === 0 && (
          <li className="text-sm text-muted-foreground">
            No scores yet today. Be the first on the board.
          </li>
        )}
        {entries.slice(0, 5).map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-2.5"
          >
            <span className="w-6 text-center">{MEDALS[e.rank - 1] ?? `#${e.rank}`}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">@{e.username}</p>
              <p className="truncate text-[0.7rem] text-muted-foreground">{e.styleLabel}</p>
            </div>
            <span className="font-display text-lg font-extrabold text-accent">
              {e.dripScore.toFixed(1)}
            </span>
          </li>
        ))}
      </ol>
      <Link
        to="/leaderboard"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent hover:underline"
      >
        Full leaderboard <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
}

/** Keeps only characters the server accepts, so a typo can't fail the save later. */
const cleanUsername = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 24);

function IdentityGate({ onSubmit }: { onSubmit: (identity: Identity) => void }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  const valid = displayName.trim().length >= 2 && username.length >= 2;
  const submit = () => onSubmit({ displayName: displayName.trim(), username });

  return (
    <div className="drip-card mx-auto max-w-md space-y-5 rounded-3xl p-7 text-center drip-rise sm:p-9">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-sand text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-editorial text-2xl">Who&apos;s stepping in?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your name is required — your score goes on today&apos;s leaderboard under it.
        </p>
      </div>
      <form
        className="space-y-3 text-left"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) submit();
        }}
      >
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          aria-label="Display name"
          required
          minLength={2}
          maxLength={40}
          autoFocus
          className="w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-accent/60"
        />
        <input
          value={username}
          onChange={(e) => setUsername(cleanUsername(e.target.value))}
          placeholder="@username"
          aria-label="Username"
          required
          minLength={2}
          maxLength={24}
          className="w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-accent/60"
        />
        <p className="text-[0.7rem] text-muted-foreground">
          Letters, numbers, dots, dashes and underscores.
        </p>
        <button
          type="submit"
          className="drip-btn-primary w-full justify-center disabled:opacity-50"
          disabled={!valid}
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
