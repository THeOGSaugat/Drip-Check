import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bookmark, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/drip/PageHeader";
import { useUser } from "@/hooks/use-user";
import { listSavedFits, deleteSavedFit } from "@/lib/account.functions";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Fits — DripCheck" },
      {
        name: "description",
        content: "Your saved outfits and past Drip Score results, all in one place.",
      },
      { property: "og:title", content: "Saved Fits — DripCheck" },
      { property: "og:description", content: "Keep the fits worth repeating." },
    ],
  }),
  component: SavedPage,
});

type SavedFit = {
  id: string;
  image_url: string;
  drip_score: number;
  style_label: string;
  summary: string | null;
  created_at: string;
};

function SavedPage() {
  const { user, loading: userLoading } = useUser();
  const getSavedFits = useServerFn(listSavedFits);
  const removeFit = useServerFn(deleteSavedFit);

  const [fits, setFits] = useState<SavedFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await getSavedFits();
        if (!active) return;
        if (res.ok) {
          setFits(res.fits);
        } else {
          toast.error(res.error);
        }
      } catch (err) {
        console.error("[saved] failed to load saved fits", err);
        if (active) {
          const message = err instanceof Error ? err.message : String(err);
          toast.error(`Could not load your saved fits: ${message}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, getSavedFits]);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      const res = await removeFit({ data: { id } });
      if (res.ok) {
        setFits((prev) => prev.filter((f) => f.id !== id));
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      console.error("[saved] failed to remove fit", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Could not remove this fit: ${message}`);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="Saved"
        title="Your saved fits"
        subtitle="Every fit you've bookmarked from a Drip Score result."
      />

      {userLoading || loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : !user ? (
        <div className="drip-card flex flex-col items-center gap-4 rounded-3xl p-12 text-center">
          <Bookmark className="h-7 w-7 text-accent" />
          <p className="text-sm text-muted-foreground">Sign in to see your saved fits.</p>
          <Link to="/auth" search={{ redirect: "/saved" }} className="drip-btn-primary">
            Sign in
          </Link>
        </div>
      ) : fits.length === 0 ? (
        <div className="drip-card flex flex-col items-center gap-3 rounded-3xl p-12 text-center">
          <Bookmark className="h-7 w-7 text-accent" />
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <Link to="/check" className="text-sm text-accent underline underline-offset-4">
            Check a fit to save one
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {fits.map((fit) => (
            <div key={fit.id} className="drip-card flex gap-4 overflow-hidden rounded-3xl p-4">
              <img
                src={fit.image_url}
                alt={fit.style_label}
                loading="lazy"
                className="h-28 w-20 shrink-0 rounded-2xl object-cover"
              />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-bold">{fit.style_label}</p>
                    <span className="font-display text-xl font-extrabold text-accent">
                      {Number(fit.drip_score).toFixed(1)}
                    </span>
                  </div>
                  {fit.summary && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{fit.summary}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemove(fit.id)}
                  disabled={removingId === fit.id}
                  className="mt-2 flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {removingId === fit.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}