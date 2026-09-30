import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ArrowRight, RefreshCw, Share2 } from "lucide-react";
import { PageHeader } from "@/components/drip/PageHeader";
import { ResultPanel } from "@/components/live/ResultPanel";
import { ScanBooth } from "@/components/live/ScanBooth";
import { analyzeFit } from "@/lib/live-check.functions";
import { getDeviceKey, shareFitResult } from "@/lib/live-client";
import type { FitAnalysis } from "@/lib/live-types";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Fit Check — DripCheck" },
      {
        name: "description",
        content:
          "Step in front of the camera, turn slowly, and get a personal Drip Score, style breakdown and suggestions — based only on what the camera can see.",
      },
      { property: "og:title", content: "Live Fit Check — DripCheck" },
      {
        property: "og:description",
        content: "Step in. Give us a look. Let's check the drip.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LivePage,
});

/**
 * Live Check is PERSONAL: no name, no leaderboard, no Top 3. The result is
 * shown to the person and then forgotten — analyzeFit has no database write.
 */
function LivePage() {
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(null);

  const onScan = useCallback(async (frames: string[]) => {
    const res = await analyzeFit({ data: { frames, deviceKey: getDeviceKey() } });
    if (!res.ok) return { ok: false as const, error: res.error };
    setAnalysis(res.analysis);
    return { ok: true as const };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="Live Check"
        title="LIVE FIT CHECK"
        subtitle="Step in. Give us a look. Let's check the drip."
      />

      <ScanBooth
        onScan={onScan}
        stageLabel="DripCheck Live"
        startLabel="Start Check"
        idleNote="Personal check — nothing is saved. We score the outfit, never the person."
        aside={<ScanGuide />}
        renderResult={(again) =>
          analysis && (
            <div className="space-y-6">
              <ResultPanel analysis={analysis} />
              <div className="flex flex-wrap gap-3">
                <button
                  className="drip-btn-ghost"
                  onClick={() => void shareFitResult(analysis.dripScore, analysis.styleLabel)}
                >
                  <Share2 className="h-4 w-4" /> Share Result
                </button>
                <button
                  className="drip-btn-primary"
                  onClick={() => {
                    setAnalysis(null);
                    again();
                  }}
                >
                  <RefreshCw className="h-4 w-4" /> Check Another Fit
                </button>
                <Link to="/" className="drip-btn-ghost">
                  ← Back Home
                </Link>
              </div>
            </div>
          )
        }
      />
    </div>
  );
}

const GUIDE_STEPS = [
  "Stand back so your fit is in frame — head to shoes if you can.",
  "Hit Start, then turn slowly through the prompts for about 6 seconds.",
  "We read a few frames and score only what the camera actually saw.",
  "Anything out of frame is marked Not Visible — it never lowers your score.",
];

function ScanGuide() {
  return (
    <aside className="drip-card h-fit rounded-3xl p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
        How the scan works
      </h2>
      <ol className="mt-4 space-y-3">
        {GUIDE_STEPS.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="font-display text-xs font-bold text-accent">0{i + 1}</span>
            <span className="text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          This is a personal check — it never goes on the leaderboard.
        </p>
        <Link
          to="/rating-game"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent hover:underline"
        >
          Want to compete? Rating Game <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
