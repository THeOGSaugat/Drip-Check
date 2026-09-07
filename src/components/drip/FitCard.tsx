import { Link } from "@tanstack/react-router";
import type { Fit } from "@/lib/drip-data";
import { cn } from "@/lib/utils";
import { CompareFitModal } from "@/components/drip/CompareFitModal";

export function FitCard({ fit, className }: { fit: Fit; className?: string }) {
  return (
    <article className={cn("group w-[248px] shrink-0", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-sand">
        <img
          src={fit.imageUrl}
          alt={`Outfit posted by ${fit.username}`}
          loading="lazy"
          width={768}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        <span className="drip-chip absolute right-3 top-3 font-display text-sm font-semibold text-foreground">
          {fit.dripScore.toFixed(1)}
        </span>

        {/* Identity merges into the bottom of the photo, editorial-card style */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3.5 pt-12">
          <p className="font-editorial text-lg leading-none text-white">@{fit.username}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {fit.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to="/discover"
                search={{ category: tag }}
                className="text-[0.66rem] uppercase tracking-[0.14em] text-white/75 transition-colors hover:text-white"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3">
        <CompareFitModal fit={fit} />
      </div>
    </article>
  );
}

export function FitCardSkeleton() {
  return (
    <div className="w-[248px] shrink-0">
      <div className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />
      <div className="mt-3 h-8 w-full animate-pulse rounded-full bg-muted" />
    </div>
  );
}