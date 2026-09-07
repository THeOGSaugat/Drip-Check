import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
};

export function ScoreRing({ score, size = 132, stroke = 8, label, className }: Props) {
  const [progress, setProgress] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setProgress(score / 10), 120);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-accent drip-ring"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedScore value={score} className="font-display text-3xl font-extrabold leading-none" />
        {label && (
          <span className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function AnimatedScore({
  value,
  className,
  duration = 1100,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display.toFixed(1)}</span>;
}
