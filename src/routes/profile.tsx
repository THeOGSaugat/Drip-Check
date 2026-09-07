import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Pencil } from "lucide-react";
import { PageHeader } from "@/components/drip/PageHeader";
import { ScoreRing } from "@/components/drip/ScoreRing";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/lib/auth-actions";
import { getMyProfile, updateMyProfile, listSavedFits } from "@/lib/account.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — DripCheck" },
      {
        name: "description",
        content: "Track your average Drip Score, style streaks and outfit history on DripCheck.",
      },
      { property: "og:title", content: "Your Profile — DripCheck" },
      { property: "og:description", content: "Your fits. Your scores. Your streak." },
    ],
  }),
  component: ProfilePage,
});

type Profile = { id: string; username: string; display_name: string; avatar_url: string | null };
type SavedFit = { id: string; drip_score: number };

function SignInPrompt() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="Profile"
        title="Your drip, tracked"
        subtitle="Sign in to see your average Drip Score, style streaks and outfit history."
      />
      <div className="drip-card flex flex-col items-center gap-4 rounded-3xl p-12 text-center">
        <Link to="/auth" search={{ redirect: "/profile" }} className="drip-btn-primary">
          Sign in
        </Link>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const getProfile = useServerFn(getMyProfile);
  const updateProfile = useServerFn(updateMyProfile);
  const getSavedFits = useServerFn(listSavedFits);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fits, setFits] = useState<SavedFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [profileRes, fitsRes] = await Promise.all([getProfile(), getSavedFits()]);
        if (!active) return;
        if (profileRes.ok) {
          setProfile(profileRes.profile);
          setDisplayName(profileRes.profile.display_name);
          setUsername(profileRes.profile.username);
        } else {
          toast.error(profileRes.error);
        }
        if (fitsRes.ok) {
          setFits(fitsRes.fits);
        } else {
          toast.error(fitsRes.error);
        }
      } catch (err) {
        console.error("[profile] failed to load profile data", err);
        if (active) {
          const message = err instanceof Error ? err.message : String(err);
          toast.error(`Could not load your profile: ${message}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, getProfile, getSavedFits]);

  if (userLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-8">
        <div className="h-32 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!user) return <SignInPrompt />;

  const handleSave = async () => {
    const trimmedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9._]{2,24}$/.test(trimmedUsername)) {
      setError("Username can only use lowercase letters, numbers, dots and underscores (2-24 chars).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateProfile({ data: { username: trimmedUsername, displayName } });
      if (!res.ok) {
        setError(res.error);
      } else {
        setProfile((p) => (p ? { ...p, username: trimmedUsername, display_name: displayName } : p));
        setUsername(trimmedUsername);
        setEditing(false);
        toast.success("Profile updated.");
      }
    } catch (err) {
      console.error("[profile] failed to update profile", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Something went wrong saving your profile: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const count = fits.length;
  const best = count > 0 ? Math.max(...fits.map((f) => f.drip_score)) : 0;
  const avg = count > 0 ? fits.reduce((s, f) => s + f.drip_score, 0) / count : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-5 py-10 sm:px-8">
      <PageHeader
        eyebrow="Profile"
        title="Your drip, tracked"
        subtitle="Your fits. Your scores. Your streak."
      />

      <div className="drip-card flex flex-col gap-6 rounded-3xl p-10 sm:flex-row sm:items-center">
        <ScoreRing score={avg} label="Avg score" />
        <div className="flex-1">
          {!editing ? (
            <>
              <div className="flex items-center gap-2">
                <p className="font-display text-xl font-bold">@{profile?.username}</p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit profile"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">{profile?.display_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {count} fit{count === 1 ? "" : "s"} saved · Best score {best.toFixed(1)}
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Username</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  minLength={2}
                  maxLength={24}
                  className="w-full max-w-xs rounded-xl border border-border bg-transparent px-3 py-2"
                />
                <span className="block text-xs text-muted-foreground">
                  Lowercase letters, numbers, dots and underscores only — no @ or spaces.
                </span>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Display name</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  minLength={1}
                  maxLength={40}
                  className="w-full max-w-xs rounded-xl border border-border bg-transparent px-3 py-2"
                />
              </label>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="drip-btn-primary"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" className="drip-btn-ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="drip-btn-ghost self-start sm:self-center"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {count === 0 ? (
        <div className="drip-card rounded-3xl p-10 text-center text-sm text-muted-foreground">
          No fits saved yet.{" "}
          <Link to="/check" className="text-accent underline underline-offset-4">
            Check a fit
          </Link>{" "}
          and save it to build your history.
        </div>
      ) : (
        <Link
          to="/saved"
          className="drip-card block rounded-3xl p-6 text-sm text-muted-foreground hover:text-foreground"
        >
          View all {count} saved fit{count === 1 ? "" : "s"} →
        </Link>
      )}
    </div>
  );
}