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
          "Meet the developers behind DripCheck — Kiran Rai and Saugat Rai — and the story behind the AI fit-scoring app.",
      },
      { property: "og:title", content: "About Us — DripCheck" },
      { property: "og:description", content: "The two developers building DripCheck." },
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
    name: "Kiran Rai",
    role: "Co-Founder & Developer",
    initials: "KR",
    bio: "Builds the product end to end — from the live camera fit-check flow to the scoring pipeline — with a focus on clean, fast interfaces.",
    links: [
      { icon: Github, label: "GitHub", href: "https://github.com/" },
      { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/" },
      { icon: Mail, label: "Email", href: "mailto:hello@dripcheck.app" },
    ],
  },
  {
    name: "Saugat Rai",
    role: "Co-Founder & Developer",
    initials: "SR",
    bio: "Works on the AI analysis engine and platform architecture, making sure every fit gets a fair, consistent verdict.",
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
        eyebrow="About us"
        title="Two developers. One verdict engine."
        subtitle="DripCheck is built and maintained by a small two-person team who wanted an honest, AI-powered second opinion on their outfits."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {DEVELOPERS.map((dev) => (
          <article key={dev.name} className="drip-card flex flex-col gap-5 rounded-3xl p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand font-display text-lg font-bold text-accent">
              {dev.initials}
            </div>
            <div>
              <h2 className="font-editorial text-2xl">{dev.name}</h2>
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

      <section className="drip-card rounded-3xl p-8 sm:p-10">
        <h2 className="font-editorial text-3xl">Why we built DripCheck</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          We kept asking each other &quot;does this fit go?&quot; before every trip out — so we
          built an AI that answers it instantly. DripCheck reads the garments in a photo, scores
          style, colour and coordination, and gives concrete suggestions. It never judges the
          person, only the outfit.
        </p>
        <Link
          to="/check"
          className="drip-btn-primary mt-6 inline-flex w-fit"
        >
          Try DripCheck <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
