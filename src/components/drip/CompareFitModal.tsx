import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadPanel } from "@/components/check/UploadPanel";
import { compareFitToMyStyle } from "@/lib/compare.functions";
import { getDeviceKey } from "@/lib/live-client";
import type { Fit } from "@/lib/drip-data";
import type { CompareVerdict } from "@/lib/compare-types";

type Stage = "upload" | "comparing" | "result";

/** Fetches a same-origin/static asset URL and converts it to a base64 data URL. */
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function MatchRing({ percent }: { percent: number }) {
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r="34" strokeWidth="6" className="fill-none stroke-muted" />
        <circle
          cx="40"
          cy="40"
          r="34"
          strokeWidth="6"
          strokeLinecap="round"
          className="fill-none stroke-accent transition-all duration-700 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold leading-none">{percent}%</span>
        <span className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
          match
        </span>
      </div>
    </div>
  );
}

export function CompareFitModal({ fit }: { fit: Fit }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<CompareVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const compare = useServerFn(compareFitToMyStyle);

  const reset = useCallback(() => {
    setStage("upload");
    setPreview(null);
    setVerdict(null);
    setError(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const runCompare = useCallback(
    async (myImage: string) => {
      setStage("comparing");
      setError(null);
      try {
        const targetImage = await urlToDataUrl(fit.imageUrl);
        const res = await compare({
          data: { myImage, targetImage, deviceKey: getDeviceKey() },
        });
        if (!res.ok) {
          setError(res.error);
          setStage("upload");
          return;
        }
        setVerdict(res.verdict);
        setStage("result");
      } catch {
        setError("Comparison failed. Check your connection and try again.");
        setStage("upload");
      }
    },
    [compare, fit.imageUrl],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="drip-chip flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-foreground transition-colors hover:text-accent"
      >
        <Sparkles className="h-3.5 w-3.5" /> Compare with my style
      </button>

      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Compare with @{fit.username}&apos;s fit
          </DialogTitle>
          <DialogDescription>
            Upload one of your own fit photos and we&apos;ll read how this style, palette and
            silhouette lines up with yours. This is a style-compatibility read, not a photo of you
            wearing it — free, and only ever compares clothing.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {stage === "upload" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Target fit
                </p>
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
                  <img
                    src={fit.imageUrl}
                    alt={`Outfit posted by ${fit.username}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Your fit
                </p>
                <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30" />
              </div>
            </div>
            <UploadPanel
              preview={preview}
              onImage={(dataUrl) => {
                setPreview(dataUrl);
                setError(null);
              }}
              onClear={() => setPreview(null)}
            />
            {preview && (
              <button
                type="button"
                className="drip-btn-primary w-full justify-center"
                onClick={() => void runCompare(preview)}
              >
                Compare styles
              </button>
            )}
          </div>
        )}

        {stage === "comparing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Reading both fits…</p>
          </div>
        )}

        {stage === "result" && verdict && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
                <img
                  src={fit.imageUrl}
                  alt={`Outfit posted by ${fit.username}`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-sand">
                {preview && (
                  <img src={preview} alt="Your fit" className="h-full w-full object-contain" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <MatchRing percent={verdict.matchPercent} />
              <p className="font-editorial text-lg leading-snug">{verdict.headline}</p>
            </div>

            {verdict.working.length > 0 && (
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Why it works
                </p>
                <ul className="space-y-1.5 text-sm">
                  {verdict.working.map((w) => (
                    <li key={w} className="flex gap-2">
                      <span className="text-accent">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {verdict.watchOuts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Worth adjusting
                </p>
                <ul className="space-y-1.5 text-sm">
                  {verdict.watchOuts.map((w) => (
                    <li key={w} className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {verdict.suggestedTweak && (
              <div className="drip-card rounded-2xl p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Try this
                </p>
                <p className="mt-1 text-sm">{verdict.suggestedTweak}</p>
              </div>
            )}

            <button type="button" className="drip-btn-ghost w-full justify-center" onClick={reset}>
              Try another photo
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
