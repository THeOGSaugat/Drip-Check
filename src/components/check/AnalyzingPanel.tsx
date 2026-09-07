import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
  "Reading the photo",
  "Detecting visible garments",
  "Reading the colour palette",
  "Scoring the styling",
  "Writing the verdict",
];

/** Honest progress: steps advance while the request is genuinely in flight. */
export function AnalyzingPanel({ preview }: { preview: string | null }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid gap-6 sm:grid-cols-[1.1fr_1fr] sm:items-center">
      <div className="drip-card relative overflow-hidden rounded-3xl">
        {preview && (
          <img src={preview} alt="Outfit being analyzed" className="max-h-[52vh] w-full object-contain" />
        )}
        <div className="pointer-events-none absolute inset-0 drip-scan-sweep" />
      </div>
      <div className="space-y-4">
        <p className="font-display text-2xl font-bold tracking-tight">CHECKING THE DRIP…</p>
        <ul className="space-y-2">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={
                i <= step ? "flex items-center gap-2 text-sm" : "flex items-center gap-2 text-sm text-muted-foreground/60"
              }
            >
              {i === step ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
              {label}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Analysis reads only the clothing that is visible. Nothing about the person is scored.
        </p>
      </div>
    </div>
  );
}
