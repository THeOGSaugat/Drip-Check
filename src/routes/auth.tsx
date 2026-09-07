import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { useUser } from "@/hooks/use-user";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth-actions";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — DripCheck" },
      {
        name: "description",
        content: "Sign in to DripCheck to save fits and track your Drip Score.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const { user, loading } = useUser();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: redirect ?? "/profile" });
    }
  }, [loading, user, redirect, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    const result =
      mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

    if (!result.ok) {
      setError(result.error);
    } else if (mode === "signup") {
      setNotice("Account created. Check your email if confirmation is required, then sign in.");
      setMode("signin");
    }
    // On successful sign-in the useUser subscription flips `user` and the effect above redirects.
    setSubmitting(false);
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center justify-center px-5 py-10">
      <Logo />
      <div className="drip-card mt-8 w-full rounded-3xl p-6">
        <h1 className="font-display text-xl font-bold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to see your saved fits and profile."
            : "Save fits, track your Drip Score history."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-transparent px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-border bg-transparent px-3 py-2"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl border border-accent/40 bg-accent/5 px-3 py-2 text-xs text-accent-foreground">
              {notice}
            </p>
          )}

          <button
            type="submit"
            className="drip-btn-primary w-full justify-center"
            disabled={submitting}
          >
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
