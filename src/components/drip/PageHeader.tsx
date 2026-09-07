export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="drip-rise space-y-3">
      {eyebrow && (
        <span className="drip-chip border-accent/25 bg-accent/[0.07] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h1 className="font-editorial text-4xl leading-[1.02] sm:text-5xl">{title}</h1>
      {subtitle && (
        <p className="max-w-xl text-justify leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
      <span
        aria-hidden="true"
        className="block h-px w-16 bg-gradient-to-r from-accent to-transparent"
      />
    </header>
  );
}