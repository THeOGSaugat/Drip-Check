import { createFileRoute, Link } from "@tanstack/react-router";
import { Github, Linkedin, Mail, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/drip/PageHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — DripCheck" },
      {
        name: "description",
        content:
          "DripCheck is an AI-powered fashion platform for those who love to enhance their fit. Meet the developers, Saugat Rai and Kiran Rai, behind the app.",
      },
      { property: "og:title", content: "About Us — DripCheck" },
      {
        property: "og:description",
        content: "For those who love to enhance their fit. Meet the developers building DripCheck.",
      },
    ],
  }),
  component: AboutPage,
});

type Developer = {
  name: string;
  role: string;
  initials: string;
  bio: string;
  links: { icon: typeof Github; label: string; href: string }[];
};

const DEVELOPERS: Developer[] = [
  {
    name: "Saugat Rai",
    role: "Design • Frontend • Creative Ideas",
    initials: "SR",
    bio: "Saugat focuses on DripCheck's design and frontend experience, along with creative ideas and shaping new concepts for the app.",
    links: [
      { icon: Github, label: "GitHub", href: "https://github.com/" },
      { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/" },
      { icon: Mail, label: "Email", href: "mailto:hello@dripcheck.app" },
    ],
  },
  {
    name: "Kiran Rai",
    role: "Backend • Features • Development",
    initials: "KR",
    bio: "Kiran focuses on the backend, implementing new features, handling development tasks, and building the functionality behind DripCheck.",
    links: [
      { icon: Github, label: "GitHub", href: "https://github.com/" },
      { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/" },
      { icon: Mail, label: "Email", href: "mailto:hello@dripcheck.app" },
    ],
  },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="About DripCheck"
        title="For those who love to enhance their fit."
        subtitle="DripCheck is an AI-powered fashion platform made for fashion lovers who want to enhance their outfits, discover better combinations, and feel more confident in what they wear."
      />

      <section className="drip-card rounded-3xl p-8 sm:p-10">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Get outfit feedback, discover styling suggestions, and find inspiration to take your
          everyday fit to the next level.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="drip-card rounded-3xl p-8">
          <h2 className="font-editorial text-2xl leading-snug">
            Made for Fashion Lovers. Inspired by Pinterest.
          </h2>
          <span
            aria-hidden="true"
            className="mt-3 block h-px w-12 bg-gradient-to-r from-accent to-transparent"
          />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            DripCheck brings Pinterest-inspired fashion aesthetics into an interactive
            experience, helping you explore creative outfit ideas and improve your personal
            style.
          </p>
        </section>
        <section className="drip-card rounded-3xl p-8">
          <h2 className="font-editorial text-2xl leading-snug">Built for Everyday Confidence</h2>
          <span
            aria-hidden="true"
            className="mt-3 block h-px w-12 bg-gradient-to-r from-accent to-transparent"
          />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            DripCheck is also designed with IIC students in mind, helping students figure out
            what to wear, how to combine their pieces, and how to improve their everyday fits.
            Because when you feel confident in what you&apos;re wearing, you can take on
            anything.
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
            Meet the Developers
          </span>
          <h2 className="font-editorial text-3xl">The team behind DripCheck</h2>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {DEVELOPERS.map((dev) => (
            <article key={dev.name} className="drip-card flex flex-col gap-5 rounded-3xl p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand font-display text-lg font-bold text-accent">
                {dev.initials}
              </div>
              <div>
                <h3 className="font-editorial text-2xl">{dev.name}</h3>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                  {dev.role}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{dev.bio}</p>
              <div className="flex items-center gap-4 pt-1">
                {dev.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    title={link.label}
                    className="text-muted-foreground transition-colors hover:text-accent"
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="drip-card rounded-3xl p-8 text-center sm:p-10">
        <p className="font-editorial text-xl sm:text-2xl">
          DripCheck — <span className="text-muted-foreground">Your fit. Your style. Your confidence.</span>
        </p>
        <Link to="/check" className="drip-btn-primary mt-6 inline-flex w-fit">
          Try DripCheck <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}