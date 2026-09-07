import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/drip/PageHeader";
import { CategoryGrid, GenderTabs } from "@/components/drip/CategoryGrid";
import { FitCard, FitCardSkeleton } from "@/components/drip/FitCard";
import { trendingFitsQuery, type Gender } from "@/lib/drip-data";

type DiscoverSearch = { category?: string | undefined; gender?: Gender | undefined };

export const Route = createFileRoute("/discover")({
  validateSearch: (search: Record<string, unknown>): DiscoverSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    gender:
      search["gender"] === "men" || search["gender"] === "women"
        ? search["gender"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Discover Fits — DripCheck" },
      {
        name: "description",
        content:
          "Browse trending outfits by style category — streetwear, old money, vintage and more.",
      },
      { property: "og:title", content: "Discover Fits — DripCheck" },
      { property: "og:description", content: "Find your next fit inspiration." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { category, gender } = Route.useSearch();
  const { data, isLoading } = useQuery(trendingFitsQuery);

  const fits = data?.filter((f) => {
    const matchesCategory = category ? f.tags.includes(category) : true;
    const matchesGender = gender ? f.gender === gender : true;
    return matchesCategory && matchesGender;
  });

  const title = category ? `#${category}` : "Discover fits";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="Discover"
        title={title}
        subtitle="Explore what the community is wearing and how it scores."
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <GenderTabs gender={gender} category={category} />
      </div>
      <CategoryGrid gender={gender} />
      <div className="flex flex-wrap gap-5">
        {isLoading && [0, 1, 2, 3].map((i) => <FitCardSkeleton key={i} />)}
        {fits?.map((fit) => <FitCard key={fit.id} fit={fit} />)}
        {fits?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No fits in this category yet. Be the first to post one.
          </p>
        )}
      </div>
    </div>
  );
}
