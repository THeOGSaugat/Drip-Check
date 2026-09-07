import { Link } from "@tanstack/react-router";
import { STYLE_CATEGORIES, type Gender } from "@/lib/drip-data";
import { cn } from "@/lib/utils";

export function CategoryGrid({ gender }: { gender?: Gender | undefined }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {STYLE_CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          to="/discover"
          search={{ category: cat.slug, gender }}
          className="group flex items-baseline justify-between bg-card px-6 py-6 transition-colors hover:bg-sand"
        >
          <span className="font-editorial text-2xl">{cat.label}</span>
          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-accent">
            View
          </span>
        </Link>
      ))}
    </div>
  );
}

export function GenderTabs({
  gender,
  category,
}: {
  gender?: Gender | undefined;
  category?: string | undefined;
}) {
  const tabs: { slug: Gender | undefined; label: string }[] = [
    { slug: undefined, label: "All" },
    { slug: "women", label: "Women" },
    { slug: "men", label: "Men" },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {tabs.map((tab) => {
        const active = gender === tab.slug;
        return (
          <Link
            key={tab.label}
            to="/discover"
            search={{ category, gender: tab.slug }}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
