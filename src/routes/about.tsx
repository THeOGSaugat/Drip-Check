import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Camera, ImageUp, Medal, Sparkles, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import { PageHeader } from "@/components/drip/PageHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — DripCheck" },
      {
        name: "description",
        content:
          "DripCheck is an AI-powered fashion platform for understanding, improving and experimenting with your personal style — Live Check, Photo Check, the Rating Game and a daily Top 3.",
      },
      { property: "og:title", content: "About Us — DripCheck" },
      {
        property: "og:description",
        content: "Fashion should be fun, personal and easy to explore. Check your fit with AI.",
      },
    ],
  }),
  component: AboutPage,
});

type Feature = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  link?: { to: string; label: string };
};

const FEATURES: Feature[] = [
  {
    icon: Camera,
    title: "Live Check",
    body: "Analyze your outfit in real time using your camera.",
    link: { to: "/live", label: "Start a Live Check" },
  },
  {
    icon: ImageUp,
    title: "Photo Check",
    body: "Upload an outfit photo and get AI-powered feedback.",
    link: { to: "/check", label: "Upload a photo" },
  },
  {
    icon: Medal,
    title: "Rating Game",
    body: "Compete by getting your outfit rated and appear on the daily leaderboard.",
    link: { to: "/rating-game", label: "Play the Rating Game" },
  },
  {
    icon: Trophy,
    title: "Daily Top 3",
    body: "See the highest-rated outfits of the day.",
    link: { to: "/leaderboard", label: "See today's board" },
  },
  {
    icon: Sparkles,
    title: "Outfit Analysis",
    body: "Get feedback on clothing, colors, shoes, accessories and overall styling.",
  },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="About Us"
        title="About DripCheck"
        subtitle="DripCheck is an AI-powered fashion platform built for people who want to understand, improve, and experiment with their personal style."
      />

      <section className="drip-card rounded-3xl p-8 sm:p-10">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          It allows you to check your outfits using AI, get personalized style feedback, and explore
          different ways to improve your overall look.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="drip-card rounded-3xl p-8">
          <h2 className="font-editorial text-2xl leading-snug">
            Fashion should be fun, personal and easy to explore.
          </h2>
          <span
            aria-hidden="true"
            className="mt-3 block h-px w-12 bg-gradient-to-r from-accent to-transparent"
          />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            That&apos;s the main idea behind DripCheck. It helps you understand your outfit and
            experiment with your look — no stylist, no pressure, just honest feedback on what
            you&apos;re wearing.
          </p>
        </section>
        <section className="drip-card rounded-3xl p-8">
          <h2 className="font-editorial text-2xl leading-snug">Made for every kind of day</h2>
          <span
            aria-hidden="true"
            className="mt-3 block h-px w-12 bg-gradient-to-r from-accent to-transparent"
          />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Whether you&apos;re getting ready for college, going out with friends, attending a
            party, or simply trying a different style, DripCheck helps you see what&apos;s working
            and what could make the fit even better.
          </p>
        </section>
      </div>

      <section className="drip-card rounded-3xl bg-sand/60 p-8 text-center sm:p-10">
        <p className="font-editorial text-2xl leading-snug sm:text-3xl">
          Enhance your fit. <span className="text-accent">Elevate your style.</span> Boost your
          confidence.
        </p>
      </section>

      <section className="space-y-8">
        <header className="space-y-2">
          <span className="drip-chip border-accent/25 bg-accent/[0.07] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            What you can do
          </span>
          <h2 className="font-editorial text-3xl">Everything in DripCheck</h2>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="drip-card flex flex-col gap-5 rounded-3xl p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand text-accent">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-editorial text-2xl">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              {feature.link && (
                <Link
                  to={feature.link.to}
                  className="mt-auto inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:text-foreground"
                >
                  {feature.link.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="drip-card rounded-3xl p-8 text-center sm:p-10">
        <p className="font-editorial text-xl sm:text-2xl">
          DripCheck —{" "}
          <span className="text-muted-foreground">Your fit. Your style. Your confidence.</span>
        </p>
        <Link to="/check" className="drip-btn-primary mt-6 inline-flex w-fit">
          Try DripCheck <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
