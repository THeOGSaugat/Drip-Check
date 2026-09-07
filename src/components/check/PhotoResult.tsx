import { Bookmark, Download, RotateCcw, Share2, Sparkles, Trophy } from "lucide-react";
import { ScoreRing } from "@/components/drip/ScoreRing";
import { PHOTO_BREAKDOWN_LABELS, type PhotoAnalysis } from "@/lib/photo-types";

type Props = {
  analysis: PhotoAnalysis;
  preview: string | null;
  onShare: () => void;
  onAnother: () => void;
  onSubmit: () => void;
  onSave: () => void;
  saved?: boolean;
  savingFit?: boolean;
  submitting?: boolean;
  submitNote?: string | null;
};

export function PhotoResult({
  analysis,
  preview,
  onShare,
  onAnother,
  onSubmit,
  onSave,
  saved,
  savingFit,
  submitting,
  submitNote,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr]">
        {preview && (
          <div className="drip-card overflow-hidden rounded-3xl">
            <img
              src={preview}
              alt="Your analyzed outfit"
              className="max-h-[52vh] w-full object-contain"
            />
          </div>
        )}
        <div className="drip-card flex flex-col items-start gap-5 rounded-3xl p-6">
          <div className="flex items-center gap-5">
            <ScoreRing score={analysis.dripScore} label="Drip score" />
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
                {analysis.source === "ai" ? "Analyzed by DripCheck AI" : "Demo analysis"}
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">
                {analysis.styleLabel.toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Best for: {analysis.occasion}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
          {analysis.visibleItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analysis.visibleItems.map((i) => (
                <span key={i} className="rounded-full border border-border px-3 py-1 text-xs">
                  {i}
                </span>
              ))}
            </div>
          )}
          {analysis.notVisible.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Not visible in this photo: {analysis.notVisible.join(", ")}
            </p>
          )}
        </div>
      </div>

      <section className="drip-card rounded-3xl p-6">
        <h2 className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
          Style breakdown
        </h2>
        <ul className="mt-4 space-y-3">
          {PHOTO_BREAKDOWN_LABELS.map(({ key, label }) => {
            const cat = analysis.breakdown[key];
            return (
              <li key={key} className="flex items-center gap-4">
                <span className="w-32 shrink-0 text-sm">{label}</span>
                <span className="h-1 flex-1 rounded-full bg-border">
                  {cat.visible && cat.score !== null && (
                    <span
                      className="block h-1 rounded-full bg-accent transition-all duration-700"
                      style={{ width: `${cat.score * 10}%` }}
                    />
                  )}
                </span>
                <span className="w-24 text-right font-display text-sm font-semibold">
                  {cat.visible && cat.score !== null ? cat.score.toFixed(1) : "Not visible"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="drip-card rounded-3xl p-6">
          <h2 className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
            What&apos;s working
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {analysis.working.map((w) => (
              <li key={w} className="flex gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {w}
              </li>
            ))}
          </ul>
        </section>
        <section className="drip-card rounded-3xl p-6">
          <h2 className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
            Level up
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {analysis.levelUp.map((t) => (
              <li key={t.title}>
                <p className="font-semibold">{t.title}</p>
                <p className="text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="drip-card rounded-3xl p-6">
          <h2 className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
            Colour palette
          </h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {analysis.palette.map((c) => (
              <div key={c.name + c.hex} className="flex items-center gap-2">
                <span
                  className="h-8 w-8 rounded-full border border-border"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm">{c.name}</span>
              </div>
            ))}
          </div>
          {analysis.combos.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">Try: {analysis.combos.join(" · ")}</p>
          )}
        </section>
        <section className="drip-card rounded-3xl p-6">
          <h2 className="text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
            Style match
          </h2>
          <ul className="mt-4 space-y-3">
            {analysis.styleMatch.map((m) => (
              <li key={m.label} className="flex items-center gap-4">
                <span className="w-32 shrink-0 text-sm">{m.label}</span>
                <span className="h-1 flex-1 rounded-full bg-border">
                  <span
                    className="block h-1 rounded-full bg-accent"
                    style={{ width: `${m.percent}%` }}
                  />
                </span>
                <span className="w-12 text-right text-sm">{m.percent}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="drip-btn-primary"
          onClick={onSave}
          disabled={saved || savingFit}
        >
          <Bookmark className="h-4 w-4" /> {saved ? "Saved" : savingFit ? "Saving…" : "Save fit"}
        </button>
        <button type="button" className="drip-btn-ghost" onClick={onSubmit} disabled={submitting}>
          <Trophy className="h-4 w-4" /> {submitting ? "Submitting…" : "Add to Today's Leaderboard"}
        </button>
        <button type="button" className="drip-btn-ghost" onClick={onShare}>
          <Share2 className="h-4 w-4" /> Share result
        </button>

        <button type="button" className="drip-btn-ghost" onClick={onShare}>
          <Download className="h-4 w-4" /> Download card
        </button>
        <button type="button" className="drip-btn-ghost" onClick={onAnother}>
          <RotateCcw className="h-4 w-4" /> Check another fit
        </button>
      </div>
      {submitNote && <p className="text-sm text-muted-foreground">{submitNote}</p>}
    </div>
  );
}
