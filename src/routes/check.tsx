import { useCallback, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "@/components/drip/PageHeader";
import { UploadPanel } from "@/components/check/UploadPanel";
import { AnalyzingPanel } from "@/components/check/AnalyzingPanel";
import { PhotoResult } from "@/components/check/PhotoResult";
import { analyzePhotoFit } from "@/lib/photo-check.functions";
import { submitLiveScore } from "@/lib/live-check.functions";
import { saveFit } from "@/lib/account.functions";
import { getDeviceKey } from "@/lib/live-client";
import { shareOrDownloadCard } from "@/lib/share-card";
import { useUser } from "@/hooks/use-user";
import { PHOTO_BREAKDOWN_LABELS, type PhotoAnalysis } from "@/lib/photo-types";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Photo Fit Check — DripCheck" },
      {
        name: "description",
        content:
          "Upload your mirror pic and get an AI style analysis with a Drip Score out of 10 plus styling suggestions.",
      },
      { property: "og:title", content: "Photo Fit Check — DripCheck" },
      { property: "og:description", content: "Upload a fit. Get the verdict." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckPage,
});

type Stage = "upload" | "analyzing" | "result";

function CheckPage() {
  const analyze = useServerFn(analyzePhotoFit);
  const submit = useServerFn(submitLiveScore);
  const save = useServerFn(saveFit);
  const navigate = useNavigate();
  const { user } = useUser();

  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingFit, setSavingFit] = useState(false);

  const runAnalysis = useCallback(
    async (image: string) => {
      setStage("analyzing");
      setError(null);
      try {
        const res = await analyze({ data: { image, deviceKey: getDeviceKey() } });
        if (!res.ok) {
          setError(res.error);
          setStage("upload");
          return;
        }
        setAnalysis(res.analysis);
        setStage("result");
      } catch {
        setError("Analysis failed. Check your connection and try again.");
        setStage("upload");
      }
    },
    [analyze],
  );

  const reset = () => {
    setPreview(null);
    setAnalysis(null);
    setStage("upload");
    setError(null);
    setShowForm(false);
    setSubmitNote(null);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!analysis || !preview || saved || savingFit) return;
    if (!user) {
      toast.error("Sign in to save fits.");
      void navigate({ to: "/auth", search: { redirect: "/check" } });
      return;
    }
    setSavingFit(true);
    const breakdown = Object.fromEntries(
      PHOTO_BREAKDOWN_LABELS.filter(({ key }) => analysis.breakdown[key].visible).map(({ key }) => [
        key,
        analysis.breakdown[key].score as number,
      ]),
    );
    try {
      const res = await save({
        data: {
          image: preview,
          dripScore: analysis.dripScore,
          styleLabel: analysis.styleLabel,
          summary: analysis.summary,
          breakdown,
          source: "photo",
        },
      });
      if (res.ok) {
        setSaved(true);
        toast.success("Fit saved.");
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      console.error("[check] failed to save fit", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Could not save this fit: ${message}`);
    } finally {
      setSavingFit(false);
    }
  };

  const handleShare = async () => {
    if (!analysis) return;
    const result = await shareOrDownloadCard(analysis);
    if (result === "failed") toast.error("Could not build the share card.");
    else if (result === "downloaded") toast.success("Share card downloaded.");
  };

  const handleSubmit = async () => {
    if (!analysis) return;
    setSubmitting(true);
    setSubmitNote(null);
    const breakdown = Object.fromEntries(
      PHOTO_BREAKDOWN_LABELS.filter(({ key }) => analysis.breakdown[key].visible).map(({ key }) => [
        key,
        analysis.breakdown[key].score as number,
      ]),
    );
    try {
      const res = await submit({
        data: {
          deviceKey: getDeviceKey(),
          displayName: displayName.trim(),
          username: username.trim().replace(/^@/, ""),
          dripScore: analysis.dripScore,
          styleLabel: analysis.styleLabel,
          verdict: analysis.summary,
          breakdown,
        },
      });
      if (!res.ok) {
        setSubmitNote(res.error);
      } else if (res.rank <= 3) {
        setSubmitNote(`🔥 You made the leaderboard — you're #${res.rank} today.`);
        setShowForm(false);
      } else {
        setSubmitNote(`You're currently #${res.rank} today. Beat the score and try again.`);
        setShowForm(false);
      }
    } catch {
      setSubmitNote("Could not submit right now. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="Photo Check"
        title="Got the perfect mirror pic?"
        subtitle="Upload a fit and get a Drip Score, colour read and styling notes. Only visible clothing is analyzed — never the person."
      />

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {stage === "upload" && (
        <>
          <UploadPanel
            preview={preview}
            onImage={(dataUrl) => {
              setPreview(dataUrl);
              setError(null);
            }}
            onClear={reset}
          />
          {preview && (
            <button
              type="button"
              className="drip-btn-primary"
              onClick={() => void runAnalysis(preview)}
            >
              Check the fit
            </button>
          )}
        </>
      )}

      {stage === "analyzing" && <AnalyzingPanel preview={preview} />}

      {stage === "result" && analysis && (
        <>
          <PhotoResult
            analysis={analysis}
            preview={preview}
            onShare={() => void handleShare()}
            onAnother={reset}
            onSubmit={() => setShowForm(true)}
            onSave={() => void handleSave()}
            saved={saved}
            savingFit={savingFit}
            submitting={submitting}
            submitNote={submitNote}
          />
          {showForm && (
            <form
              className="drip-card space-y-4 rounded-3xl p-6"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
            >
              <h2 className="font-display text-xl font-bold tracking-tight">
                Add to today&apos;s board
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Display name</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={40}
                    className="w-full rounded-xl border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Username</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={2}
                    maxLength={24}
                    className="w-full rounded-xl border border-border bg-transparent px-3 py-2"
                  />
                </label>
              </div>
              <button type="submit" className="drip-btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit score"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}