import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "@/components/drip/PageHeader";
import { UploadPanel } from "@/components/check/UploadPanel";
import { AnalyzingPanel } from "@/components/check/AnalyzingPanel";
import { PhotoResult } from "@/components/check/PhotoResult";
import { analyzePhotoFit } from "@/lib/photo-check.functions";
import { getDeviceKey } from "@/lib/live-client";
import { shareOrDownloadCard } from "@/lib/share-card";
import type { PhotoAnalysis } from "@/lib/photo-types";

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

  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  };

  const handleShare = async () => {
    if (!analysis) return;
    const result = await shareOrDownloadCard(analysis);
    if (result === "failed") toast.error("Could not build the share card.");
    else if (result === "downloaded") toast.success("Share card downloaded.");
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
        <PhotoResult
          analysis={analysis}
          preview={preview}
          onShare={() => void handleShare()}
          onAnother={reset}
        />
      )}
    </div>
  );
}
