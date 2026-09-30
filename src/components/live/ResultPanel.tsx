import { Check, Minus } from "lucide-react";
import { ScoreRing } from "@/components/drip/ScoreRing";
import { BREAKDOWN_LABELS, COVERAGE_LABEL, type FitAnalysis } from "@/lib/live-types";

export function ResultPanel({ analysis }: { analysis: FitAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="drip-card flex flex-col items-center gap-6 rounded-3xl p-6 text-center drip-rise sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <ScoreRing score={analysis.dripScore} size={148} stroke={8} label="Drip Score" />
        <div className="space-y-2">
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-accent">
            {analysis.partial ? "Partial Fit Check" : "Full Fit Check"}
          </p>
          <h2 className="font-editorial text-4xl leading-[1.05]">{analysis.styleLabel}</h2>
          <p className="text-sm text-muted-foreground">
            Best for <span className="text-foreground">{analysis.occasion}</span>
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="drip-card rounded-3xl p-5">
          <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Visible items
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            {analysis.visibleItems.length === 0 && (
              <li className="text-muted-foreground">Nothing clearly detected.</li>
            )}
            {analysis.visibleItems.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="drip-card rounded-3xl p-5">
          <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Not visible
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {analysis.notVisible.length === 0 && <li>Everything was in frame.</li>}
            {analysis.notVisible.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Minus className="h-3.5 w-3.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="drip-card rounded-3xl p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Style Breakdown
          </h3>
          <span className="text-[0.68rem] text-muted-foreground">
            {COVERAGE_LABEL[analysis.coverage]}
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {BREAKDOWN_LABELS.filter(({ key }) => key !== "overall").map(({ key, label }) => {
            const cat = analysis.breakdown[key];
            return (
              <li key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  {cat.visible && cat.score !== null ? (
                    <span className="font-display font-bold">{cat.score.toFixed(1)} / 10</span>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Not visible
                    </span>
                  )}
                </div>
                <div className="h-[3px] overflow-hidden rounded-full bg-muted">
                  {cat.visible && cat.score !== null ? (
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
                      style={{ width: `${cat.score * 10}%` }}
                    />
                  ) : (
                    <div className="h-full w-full bg-[repeating-linear-gradient(90deg,var(--muted),var(--muted)_5px,transparent_5px,transparent_10px)]" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-xs text-muted-foreground">
          Scores are based only on what the camera can see.
        </p>
      </section>

      <section className="drip-card rounded-3xl p-6">
        <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-accent">
          The Verdict
        </h3>
        <p className="mt-3 font-editorial text-2xl leading-snug">
          &ldquo;{analysis.verdict}&rdquo;
        </p>
      </section>

      {analysis.suggestions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Quick Suggestions
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.suggestions.map((s, i) => (
              <article
                key={`${s.title}-${i}`}
                className="drip-card rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold">
                  <span className="mr-1.5">{s.icon}</span>
                  {s.title}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
