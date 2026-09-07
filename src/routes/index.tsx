import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, ImageUp, ArrowRight, ArrowUpRight, Trophy } from "lucide-react";
import { FitCard, FitCardSkeleton } from "@/components/drip/FitCard";
import { CategoryGrid } from "@/components/drip/CategoryGrid";
import { getLiveLeaderboard } from "@/lib/live-check.functions";
import { trendingFitsQuery } from "@/lib/drip-data";
import heroCoupleImage from "@/assets/hero/hero-couple.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DripCheck — Step in. Get scored. Own the vibe." },
      {
        name: "description",
        content:
          "Check your outfit with AI, get your Drip Score out of 10, and see how your style stacks up on the daily leaderboard.",
      },
      { property: "og:title", content: "DripCheck — Your fit. AI's verdict." },
      {
        property: "og:description",
        content:
          "AI outfit analysis, Drip Scores, styling suggestions and a daily style leaderboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative z-10">
      <Hero />
      <Marquee />
      <HowItWorks />
      <Trending />
      <Categories />
      <ClosingCta />
      <SiteFooter />
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:gap-16">
        <div className="drip-rise space-y-6 sm:space-y-7">
          <span className="text-[0.66rem] uppercase tracking-[0.32em] text-muted-foreground sm:text-[0.72rem]">
            AI Fashion Analysis — Est. 2026
          </span>
          <h1 className="font-editorial text-[2.75rem] leading-[0.92] sm:text-[4rem] lg:text-[4.5rem]">
            What&apos;s the verdict
            <br />
            on your <em className="italic text-accent">fit</em>?
          </h1>
          <p className="max-w-md text-justify text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
            A good fit is what makes you feel confident. It&apos;s your first
            impression — and you feel it straight from your heart the moment
            you know your outfit just works.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/live" className="drip-btn-primary px-5 py-3 text-sm sm:text-base">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5" /> Live Fit Check
            </Link>
            <Link to="/check" className="drip-btn-ghost px-5 py-3 text-sm sm:text-base">
              <ImageUp className="h-4 w-4 sm:h-5 sm:w-5" /> Upload a Fit
            </Link>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="drip-rise relative mx-auto w-full max-w-md lg:max-w-none">
      <figure className="overflow-hidden rounded-4xl bg-sand">
        <img
          src={heroCoupleImage}
          alt="A styled fit, ready for its DripCheck verdict"
          width={1020}
          height={1200}
          className="h-[56vh] max-h-[640px] min-h-[360px] w-full object-cover sm:h-[64vh] lg:h-[74vh]"
        />
      </figure>

      <div className="absolute -bottom-6 left-4 right-4 sm:left-8 sm:right-auto sm:w-72">
        <TopRatingsCard />
      </div>
    </div>
  );
}

/**
 * Shows only real entries submitted from the /live real-time check
 * (same "live-leaderboard" query the live page uses). No demo/placeholder
 * data — if nobody has done a live check in the last 24h, this renders
 * a quiet empty state instead of hiding, so the floating card always has
 * something to sit on top of the hero image.
 */
function TopRatingsCard() {
  const { data } = useQuery({
    queryKey: ["live-leaderboard"],
    queryFn: () => getLiveLeaderboard(),
    refetchInterval: 30_000,
  });

  const top3 = (data?.entries ?? []).slice(0, 3);

  return (
    <div className="drip-card rounded-3xl p-4 shadow-lg shadow-black/[0.06] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
          Top 3 ratings of the day
        </p>
        <Trophy className="h-4 w-4 shrink-0 text-accent" />
      </div>

      {top3.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No live checks yet today — be the first.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
          {top3.map((entry, i) => (
            <li key={entry.id} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-center text-sm">
                {MEDALS[i] ?? `#${i + 1}`}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                @{entry.username}
              </span>
              <span className="shrink-0 font-display text-sm font-semibold">
                {entry.dripScore.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Marquee() {
  const items = ["Streetwear", "Old Money", "Vintage", "Casual", "Formal"];
  return (
    <div className="drip-rule mx-auto max-w-7xl px-5 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 py-5 text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
        {items.map((i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { n: "01", title: "Show the fit", body: "Use the live camera or upload a photo." },
  {
    n: "02",
    title: "AI reads the details",
    body: "Style, colours, layering, footwear and accessories — only what's visible.",
  },
  {
    n: "03",
    title: "Get the verdict",
    body: "A Drip Score, a style label and concrete suggestions.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <h2 className="font-editorial text-4xl sm:text-5xl">How it works</h2>
      <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.n} className="bg-card p-8 transition-colors hover:bg-sand">
            <p className="font-display text-[0.7rem] tracking-[0.2em] text-accent">{step.n}</p>
            <h3 className="mt-6 font-editorial text-2xl">{step.title}</h3>
            <p className="mt-2 text-justify text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Trending() {
  const { data, isLoading } = useQuery(trendingFitsQuery);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-editorial text-4xl sm:text-5xl">Trending fits</h2>
        <Link
          to="/discover"
          className="flex items-center gap-1 text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-accent"
        >
          Discover <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="drip-scroller mt-7">
        {isLoading && [0, 1, 2, 3].map((i) => <FitCardSkeleton key={i} />)}
        {data?.map((fit) => (
          <FitCard key={fit.id} fit={fit} />
        ))}
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <h2 className="font-editorial text-4xl sm:text-5xl">Style categories</h2>
      <p className="mt-2 text-justify text-muted-foreground">Pick a lane, see the fits that own it.</p>
      <div className="mt-7">
        <CategoryGrid />
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
      <div className="drip-card flex flex-col gap-6 rounded-4xl p-10 sm:flex-row sm:items-end sm:justify-between sm:p-14">
        <div className="max-w-xl">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
            Live booth
          </p>
          <h2 className="mt-3 font-editorial text-4xl leading-tight sm:text-5xl">
            Don&apos;t upload. Just step in.
          </h2>
          <p className="mt-3 text-justify text-muted-foreground">
            Turn on the camera and let DripCheck read your fit in real time.
          </p>
        </div>
        <Link to="/live" className="drip-btn-primary shrink-0">
          Start Live Check <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="flex flex-col gap-2 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-editorial text-xl">
          Drip<span className="text-accent">Check</span>
        </p>
        <div className="flex items-center gap-5">
          <Link
            to="/about"
            className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent"
          >
            About Us
          </Link>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            Step in. Get scored. Own the vibe.
          </p>
        </div>
      </div>
    </footer>
  );
}