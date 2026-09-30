import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Layers,
  ScanLine,
  Share2,
  Shirt,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { CompareFitModal } from "@/components/drip/CompareFitModal";
import { useDailyLeaderboard } from "@/hooks/use-daily-leaderboard";
import { DEMO_FITS, STYLE_CATEGORIES, trendingFitsQuery, type Fit } from "@/lib/drip-data";
import heroImage from "@/assets/hero/hero-fit.jpg";
import bannerImage from "@/assets/discover/fit-oldmoney-01.jpg";

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
      <TheFeed />
      <HowItWorks />
      <LiveBanner />
      <BrowseAndBoard />
      <FeatureBar />
      <SiteFooter />
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

/** The small line-diamond-line rule that sits under the hero headline. */
function Ornament({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span className="flex items-center gap-3">
        <span className="h-px w-12 bg-taupe" />
        <span className="text-[0.55rem] text-accent">✦</span>
        <span className="h-px w-12 bg-taupe" />
      </span>
    </div>
  );
}

const HERO_TRUST = [
  { icon: ScanLine, title: "Instant Analysis", note: "Scored in seconds" },
  { icon: Shirt, title: "Style, Not Body", note: "We read the clothes" },
  { icon: ShieldCheck, title: "Nothing Stored", note: "Scan frames never saved" },
];

function Hero() {
  return (
    <section className="lx-hero-section isolate overflow-hidden bg-gradient-to-b from-ivory via-ivory to-champagne/60">
      {/* The photograph bleeds to the right edge of the viewport and runs the
          full height of the hero, exactly as in the reference layout. Below
          lg it becomes a normal block above the copy instead. */}
      <div className="lx-hero-photo absolute inset-y-0 right-0 hidden lg:left-1/2 lg:block">
        <img
          src={heroImage}
          alt="A styled couple, ready for a DripCheck verdict"
          width={1020}
          height={1138}
          fetchPriority="high"
          className="lx-hero-img"
        />
        <span aria-hidden="true" className="lx-photo-blend" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-[0.95fr_1fr]">
          <div className="flex min-h-[78vh] flex-col py-10 lg:min-h-[86vh] lg:py-14 lg:pr-10">
            {/* Mobile / tablet photo — same treatment, stacked. */}
            <div className="lx-hero-photo-card mb-9 aspect-[4/5] w-full sm:aspect-[16/10] lg:hidden">
              <img
                src={heroImage}
                alt="A styled couple, ready for a DripCheck verdict"
                width={1020}
                height={1138}
                fetchPriority="high"
                className="lx-hero-img"
              />
              <span aria-hidden="true" className="lx-photo-tint" />
            </div>

            <div className="drip-rise flex flex-1 flex-col justify-center">
              <p className="lx-eyebrow text-accent">New Collection of You</p>

              <h1 className="mt-6 font-editorial text-[clamp(2.7rem,6.4vw,4.9rem)] uppercase leading-[0.86] tracking-[-0.02em]">
                Step in.
                <br />
                Get scored.
                <br />
                <span className="text-accent">Own the vibe.</span>
              </h1>

              <Ornament className="mt-8" />

              <p className="mt-7 text-[0.78rem] font-medium uppercase leading-[2] tracking-[0.2em] text-foreground/75">
                Your fit. AI&apos;s verdict.
                <br />
                Scored in seconds.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-6">
                <Link to="/live" className="lx-btn-primary">
                  Start Live Check
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/check"
                  className="group inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-accent"
                >
                  Or upload a photo
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Trust row, pinned to the bottom of the hero like the template */}
            <div className="mt-12 grid grid-cols-1 gap-y-6 border-t border-border pt-7 sm:grid-cols-3 sm:gap-y-0">
              {HERO_TRUST.map((item, i) => (
                <div
                  key={item.title}
                  className={i > 0 ? "sm:border-l sm:border-border sm:pl-5" : "sm:pr-5"}
                >
                  <item.icon className="h-5 w-5 text-foreground/70" strokeWidth={1.4} />
                  <p className="mt-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div aria-hidden="true" className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}

/** Section heading: centred eyebrow + serif line, with an action on the right. */
function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="relative flex flex-col items-center gap-5 sm:gap-2">
      <div className="text-center">
        <p className="lx-eyebrow text-accent">{eyebrow}</p>
        <h2 className="mt-4 font-editorial text-[clamp(1.85rem,4vw,2.9rem)] uppercase tracking-[-0.01em]">
          {title}
        </h2>
      </div>
      {action && (
        <Link to={action.to} className="lx-btn-outline sm:absolute sm:right-0 sm:top-1.5">
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function TheFeed() {
  const { data } = useQuery({ ...trendingFitsQuery, initialData: DEMO_FITS });
  const fits = data.slice(0, 4);

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHead
          eyebrow="The Feed"
          title="Trending. Rated. Real."
          action={{ to: "/discover", label: "View All" }}
        />

        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {fits.map((fit) => (
            <FeedCard key={fit.id} fit={fit} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeedCard({ fit }: { fit: Fit }) {
  return (
    <article className="lx-lift group flex flex-col border border-border bg-card shadow-xs">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        <img
          src={fit.imageUrl}
          alt={`Outfit posted by ${fit.username}`}
          loading="lazy"
          width={768}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 font-display text-[0.8rem] font-bold text-navy shadow-sm backdrop-blur">
          {fit.dripScore.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]">@{fit.username}</p>
        <p className="mt-2 font-display text-base font-bold">
          {fit.dripScore.toFixed(1)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">/ 10</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {fit.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <CompareFitModal
          fit={fit}
          triggerClassName="lx-btn-outline mt-5 w-full justify-between"
          triggerLabel="Compare Fit"
        />
      </div>
    </article>
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
    <section className="border-y border-border bg-sand/45">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHead eyebrow="The Process" title="Three steps. One verdict." />

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
          {STEPS.map((step, i) => (
            <article
              key={step.n}
              className={i > 0 ? "md:border-l md:border-border md:pl-10" : "md:pr-10"}
            >
              <p className="font-display text-[0.65rem] font-bold tracking-[0.24em] text-accent">
                {step.n}
              </p>
              <h3 className="mt-5 font-editorial text-2xl uppercase">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-navy text-ivory">
      <div className="absolute inset-y-0 right-0 w-full sm:w-[58%] lg:w-[46%]">
        <img
          src={bannerImage}
          alt="A fit being read by DripCheck"
          loading="lazy"
          className="h-full w-full object-cover object-[50%_28%]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/25 sm:via-navy/60 sm:to-transparent"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="max-w-lg">
          <h2 className="font-editorial text-[clamp(2.1rem,5vw,3.6rem)] uppercase leading-[0.9]">
            Don&apos;t upload.
            <br />
            <span className="text-champagne">Just step in.</span>
          </h2>

          <p className="mt-7 text-sm leading-[2] text-ivory/75">
            Turn on the camera and let DripCheck read your fit in real time.
            <br />A few frames are analysed as you turn. We score the outfit, never the person.
          </p>

          <Link to="/live" className="lx-btn-light mt-9">
            Start Live Check
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BrowseAndBoard() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHead eyebrow="Browse" title="Find your lane." />

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          <div className="grid grid-cols-1 border-t border-border sm:grid-cols-2">
            {STYLE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to="/discover"
                search={{ category: cat.slug }}
                className="group flex items-baseline justify-between border-b border-border py-5 pr-1 transition-colors hover:text-accent sm:odd:pr-8 sm:even:border-l sm:even:pl-8"
              >
                <span className="font-editorial text-2xl uppercase">{cat.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </Link>
            ))}
          </div>

          <TopRatingsPanel />
        </div>
      </div>
    </section>
  );
}

/**
 * Today's top 3 from the Rating Game only — the same cached query as the
 * leaderboard page, refreshed when a new score is saved and every 30s. Live
 * Check and Photo Check never write scores, so they can't appear here.
 */
function TopRatingsPanel() {
  const { data } = useDailyLeaderboard();

  const top3 = (data?.entries ?? []).slice(0, 3);

  return (
    <div className="border border-border bg-sand/45 p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="lx-eyebrow text-accent">Today&apos;s Drip</p>
        <Trophy className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
      </div>

      {top3.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          No Rating Game scores yet today — be the first on the board.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {top3.map((entry, i) => (
            <li key={entry.id} className="flex items-center gap-3 border-b border-border pb-4">
              <span className="w-6 shrink-0 text-center text-sm">{MEDALS[i] ?? `#${i + 1}`}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">@{entry.username}</span>
              <span className="shrink-0 font-display text-sm font-bold text-accent">
                {entry.dripScore.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link to="/rating-game" className="lx-btn-primary mt-7 w-full">
        Play the Rating Game
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link to="/leaderboard" className="lx-btn-outline mt-3 w-full justify-between">
        Full Leaderboard
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

const FEATURES = [
  { icon: Sparkles, title: "Real AI Analysis", note: "Vision model, not presets" },
  { icon: Trophy, title: "Daily Leaderboard", note: "Rating Game · resets at midnight" },
  { icon: Layers, title: "Style Breakdown", note: "Scored category by category" },
  { icon: Share2, title: "Share Your Score", note: "Export a clean result card" },
];

function FeatureBar() {
  return (
    <section className="border-t border-border bg-sand/70">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-9 px-5 py-11 sm:px-8 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-3.5">
            <f.icon className="mt-0.5 h-6 w-6 shrink-0 text-foreground/75" strokeWidth={1.3} />
            <div className="min-w-0">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em]">{f.title}</p>
              <p className="mt-1 text-[0.68rem] text-muted-foreground">{f.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-editorial text-xl uppercase tracking-[0.06em]">
          Drip<span className="text-accent">Check</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <Link
            to="/about"
            className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent"
          >
            About Us
          </Link>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            Step in. Get scored. Own the vibe.
          </p>
        </div>
      </div>
    </footer>
  );
}
