import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Camera,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share2,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/drip/PageHeader";
import { BodyGuide, CameraFrame, ScanOverlay } from "@/components/live/ScanOverlay";
import { ResultPanel } from "@/components/live/ResultPanel";
import {
  analyzeFit,
  checkFitFraming,
  getLiveLeaderboard,
  submitLiveScore,
} from "@/lib/live-check.functions";
import { captureFrame, getDeviceKey, useShowcaseMode, wait } from "@/lib/live-client";
import type { FitAnalysis, FramingCheck } from "@/lib/live-types";
import { cn } from "@/lib/utils";
import liveCheckTheme from "@/assets/audio/live-check-theme.mp3";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Fit Check — DripCheck" },
      {
        name: "description",
        content:
          "Step in front of the camera and let DripCheck score your outfit live with a real Drip Score, style breakdown and verdict.",
      },
      { property: "og:title", content: "Live Fit Check — DripCheck" },
      {
        property: "og:description",
        content: "Step in. Give us a look. Let's check the drip.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LivePage,
});

type Phase = "idle" | "countdown" | "scanning" | "result";

const MEDALS = ["🥇", "🥈", "🥉"];

// The scanning phase is held open for at least this long, regardless of how
// fast the server responds — matches the server's own 13s AI budget, so the
// visible countdown never finishes ahead of a slow request and then has to
// awkwardly wait on it. Split into 5 even parts (2.6s each) for a realistic
// full-circle turn: front, side, back, other side, back to front.
const MIN_SCAN_MS = 13_000;
const SCAN_STEPS = [
  "Hold still — front on",
  "Turn to your side",
  "Turn your back",
  "Turn to your other side",
  "Face front again",
] as const;
const SCAN_STEP_MS = MIN_SCAN_MS / SCAN_STEPS.length;

type Identity = { displayName: string; username: string; music: boolean };

function LivePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "denied">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ rank: number } | null>(null);
  const [framing, setFraming] = useState<FramingCheck | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const { showcase, toggleShowcase } = useShowcaseMode();
  const queryClient = useQueryClient();

  // Background music plays only from "Start Check" through the analysis —
  // never during the result, and only when the person opted in on the name
  // screen. Kept as plain ref-driven play()/pause() (not effects) so playback
  // starts directly inside the same click that satisfies the browser's
  // autoplay-with-sound requirement.
  const playMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 0.55;
    void audio.play().catch(() => undefined);
  }, []);

  const stopMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch {
      /* fullscreen unsupported */
    }
  }, []);

  const board = useQuery({
    queryKey: ["live-leaderboard"],
    queryFn: () => getLiveLeaderboard(),
    refetchInterval: 30_000,
  });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera("off");
    stopMusic();
  }, [stopMusic]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCamera("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamera("on");
    } catch (err) {
      setCamera("denied");
      setCameraError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission was blocked. Allow camera access in your browser, then try again."
          : "No camera available on this device.",
      );
    }
  }, []);

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const video = videoRef.current;
      if (!video) throw new Error("Camera is not ready.");
      const image = captureFrame(video);
      if (!image) throw new Error("Could not grab a frame — hold still and retry.");
      // Race the real request against a floor duration so the scan never
      // feels instant/glitchy — whichever finishes last wins, capped by the
      // server's own ~13s timeout budget so we never actually wait longer.
      const [res] = await Promise.all([
        analyzeFit({ data: { image, deviceKey: getDeviceKey() } }),
        wait(MIN_SCAN_MS),
      ]);
      return res;
    },
    onSuccess: (res) => {
      stopMusic();
      if (res.ok) {
        setAnalysis(res.analysis);
        setPhase("result");
      } else {
        setError(res.error);
        setPhase("idle");
      }
    },
    onError: (err: unknown) => {
      stopMusic();
      setError(err instanceof Error ? err.message : "Analysis failed. Try again.");
      setPhase("idle");
    },
  });

  const runFraming = useMutation({
    mutationFn: async () => {
      const video = videoRef.current;
      if (!video) throw new Error("Camera is not ready.");
      const image = captureFrame(video);
      if (!image) throw new Error("Could not grab a frame — hold still and retry.");
      return checkFitFraming({ data: { image, deviceKey: getDeviceKey() } });
    },
    onSuccess: (res) => {
      if (res.ok) setFraming(res.framing);
      else setError(res.error);
    },
    onError: () => setError("Framing check failed. Try again."),
  });

  const startCheck = useCallback(() => {
    if (camera !== "on") return;
    setError(null);
    setAnalysis(null);
    setPosted(null);
    setPhase("countdown");
    setCount(3);
    if (identity?.music) playMusic();
  }, [camera, identity, playMusic]);

  // Countdown → scanning → analysis
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) {
      setPhase("scanning");
      runAnalysis.mutate();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), showcase ? 1100 : 800);
    return () => clearTimeout(t);
  }, [phase, count, showcase, runAnalysis]);

  // Cycle the "turn this way" prompt through the scan window so the fixed
  // MIN_SCAN_MS floor above actually reads as a guided full-circle turn, not a
  // stalled spinner.
  useEffect(() => {
    if (phase !== "scanning") {
      setScanStep(0);
      return;
    }
    const t = setInterval(() => {
      setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1));
    }, SCAN_STEP_MS);
    return () => clearInterval(t);
  }, [phase]);

  // Showcase mode: auto-return to camera after a result
  useEffect(() => {
    if (!showcase || phase !== "result") return;
    const t = setTimeout(() => setPhase("idle"), 20_000);
    return () => clearTimeout(t);
  }, [showcase, phase]);

  const entries = board.data?.entries ?? [];
  const topScore = entries[0]?.dripScore ?? 0;
  const newHighScore =
    posted !== null && posted.rank === 1 && (analysis?.dripScore ?? 0) >= topScore;

  const shareResult = async () => {
    if (!analysis) return;
    const text = `I scored ${analysis.dripScore.toFixed(1)} 🔥 on DripCheck — ${analysis.styleLabel}`;
    try {
      if (navigator.share) await navigator.share({ title: "DripCheck", text });
      else {
        await navigator.clipboard.writeText(text);
        setError(null);
      }
    } catch {
      /* user dismissed */
    }
  };

  const resultView = analysis && (
    <div className="space-y-6">
      {newHighScore && (
        <p className="drip-rise text-center font-display text-2xl font-extrabold uppercase tracking-[0.2em] text-accent">
          🔥 New High Score
        </p>
      )}
      <ResultPanel analysis={analysis} showcase={showcase} />

      {identity && (
        <LeaderboardForm
          identity={identity}
          analysis={analysis}
          posted={posted}
          onPosted={(rank) => {
            setPosted({ rank });
            void queryClient.invalidateQueries({ queryKey: ["live-leaderboard"] });
          }}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <button className="drip-btn-ghost" onClick={shareResult}>
          <Share2 className="h-4 w-4" /> Share Result
        </button>
        <button
          className="drip-btn-primary"
          onClick={() => {
            setPhase("idle");
            setAnalysis(null);
            setPosted(null);
          }}
        >
          <RefreshCw className="h-4 w-4" /> Check Another Fit
        </button>
        <Link to="/" className="drip-btn-ghost">
          ← Back Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow="Live Check"
          title="LIVE FIT CHECK"
          subtitle="Step in. Give us a look. Let's check the drip."
        />
        <div className="flex flex-wrap items-center gap-2">
          {identity && (
            <button
              className="drip-chip text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent"
              onClick={() => setIdentity(null)}
            >
              @{identity.username} · Not you?
            </button>
          )}
          <button
            onClick={toggleShowcase}
            className={cn(
              "drip-chip transition-colors",
              showcase && "border-accent/60 text-accent",
            )}
            aria-pressed={showcase}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Showcase Mode {showcase ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {!identity && <IdentityGate onSubmit={setIdentity} />}

      <audio ref={audioRef} src={liveCheckTheme} loop preload="auto" className="hidden" />

      {identity && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div
              ref={stageRef}
              className={cn(
                "relative overflow-hidden border border-border bg-card/60",
                isFullscreen
                  ? "h-screen w-screen rounded-none"
                  : "aspect-[3/4] rounded-3xl sm:aspect-[4/5]",
              )}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={cn(
                  "h-full w-full -scale-x-100 object-cover transition-opacity duration-500",
                  camera === "on" ? "opacity-100" : "opacity-0",
                )}
              />

              {camera !== "on" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                  <Camera className="h-8 w-8 text-accent" />
                  <p className="max-w-xs px-6 text-sm text-muted-foreground">
                    {cameraError ??
                      "We need your camera to check the fit. Nothing is stored — only the single frame you capture is analyzed."}
                  </p>
                  <button
                    className="drip-btn-primary"
                    onClick={startCamera}
                    disabled={camera === "starting"}
                  >
                    {camera === "starting" ? "Starting…" : "Enable Camera"}
                  </button>
                </div>
              )}

              {camera === "on" && <CameraFrame />}
              {camera === "on" && phase === "idle" && <BodyGuide message={framing?.message} />}
              {camera === "on" && (
                <button
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className="absolute bottom-4 right-4 z-10 rounded-full border border-border bg-background/75 p-2.5 backdrop-blur transition-colors hover:border-accent/60"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              )}

              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
                <span className="drip-chip font-display text-[0.65rem] uppercase tracking-[0.3em]">
                  DripCheck Live
                </span>
                {camera === "on" && (
                  <span className="drip-chip gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                    <span className="drip-live-dot" /> Live
                  </span>
                )}
              </div>

              {phase === "countdown" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/45 backdrop-blur-sm">
                  <p className="font-display text-xs uppercase tracking-[0.4em] text-accent">
                    Get Ready
                  </p>
                  <span
                    key={count}
                    className={cn(
                      "drip-count font-display font-extrabold text-accent",
                      showcase ? "text-[10rem]" : "text-8xl",
                    )}
                  >
                    {count === 0 ? "GO" : count}
                  </span>
                </div>
              )}

              {phase === "scanning" && <ScanOverlay label={SCAN_STEPS[scanStep]} />}
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            {phase !== "result" && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="drip-btn-primary disabled:opacity-50"
                  onClick={startCheck}
                  disabled={camera !== "on" || phase !== "idle"}
                >
                  <Sparkles className="h-4 w-4" />
                  {phase === "idle" ? "Start Check" : "Checking…"}
                </button>
                {camera === "on" && phase === "idle" && (
                  <button
                    className="drip-btn-ghost disabled:opacity-50"
                    onClick={() => {
                      setError(null);
                      runFraming.mutate();
                    }}
                    disabled={runFraming.isPending}
                  >
                    <Camera className="h-4 w-4" />
                    {runFraming.isPending ? "Checking framing…" : "Check My Framing"}
                  </button>
                )}
                {camera === "on" && (
                  <button className="drip-btn-ghost" onClick={stopCamera}>
                    Turn Camera Off
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {phase === "scanning"
                    ? "Analysis running on the server right now."
                    : "One frame is captured and analyzed. We score the outfit, never the person."}
                </span>
              </div>
            )}

            {!showcase && phase === "result" && resultView}
          </div>

          <aside className="drip-card h-fit rounded-3xl p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Today&apos;s Top Drip
            </h2>
            <ol className="mt-4 space-y-2">
              {entries.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No fits scored yet today. Be the first on the board.
                </li>
              )}
              {entries.slice(0, showcase ? 10 : 5).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-2.5"
                >
                  <span className="w-6 text-center">{MEDALS[e.rank - 1] ?? `#${e.rank}`}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">@{e.username}</p>
                    <p className="truncate text-[0.7rem] text-muted-foreground">{e.styleLabel}</p>
                  </div>
                  <span className="font-display text-lg font-extrabold text-accent">
                    {e.dripScore.toFixed(1)}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}

      {identity && showcase && phase === "result" && analysis && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-6 backdrop-blur-xl sm:p-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex justify-end">
              <button className="drip-btn-ghost" onClick={() => setPhase("idle")}>
                <X className="h-4 w-4" /> Close
              </button>
            </div>
            {resultView}
          </div>
        </div>
      )}
    </div>
  );
}

function IdentityGate({ onSubmit }: { onSubmit: (identity: Identity) => void }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [music, setMusic] = useState(true);

  const valid = displayName.trim().length >= 2 && username.trim().length >= 2;

  const submit = () =>
    onSubmit({
      displayName: displayName.trim(),
      username: username.trim().replace(/^@/, ""),
      music,
    });

  return (
    <div className="drip-card mx-auto max-w-md space-y-5 rounded-3xl p-7 text-center drip-rise sm:p-9">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-sand text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-editorial text-2xl">Who&apos;s stepping in?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tell us your name before the camera starts — we&apos;ll use it if you make the
          leaderboard.
        </p>
      </div>
      <div className="space-y-3 text-left">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          maxLength={40}
          autoFocus
          className="w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-accent/60"
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@username"
          maxLength={25}
          className="w-full rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-accent/60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) submit();
          }}
        />
      </div>

      <div className="space-y-2 text-left">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
          Background music
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMusic(true)}
            aria-pressed={music}
            className={cn(
              "flex-1 rounded-2xl border px-4 py-2.5 text-sm transition-colors",
              music
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
          >
            🎵 Play music
          </button>
          <button
            type="button"
            onClick={() => setMusic(false)}
            aria-pressed={!music}
            className={cn(
              "flex-1 rounded-2xl border px-4 py-2.5 text-sm transition-colors",
              !music
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
          >
            🔇 Stay silent
          </button>
        </div>
      </div>

      <button className="drip-btn-primary w-full justify-center disabled:opacity-50" disabled={!valid} onClick={submit}>
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function LeaderboardForm({
  identity,
  analysis,
  posted,
  onPosted,
}: {
  identity: Identity;
  analysis: FitAnalysis;
  posted: { rank: number } | null;
  onPosted: (rank: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      submitLiveScore({
        data: {
          deviceKey: getDeviceKey(),
          displayName: identity.displayName,
          username: identity.username,
          dripScore: analysis.dripScore,
          styleLabel: analysis.styleLabel,
          verdict: analysis.verdict,
          breakdown: Object.fromEntries(
            Object.entries(analysis.breakdown)
              .filter(([, c]) => c.visible && c.score !== null)
              .map(([k, c]) => [k, c.score as number]),
          ),
        },
      }),
    onSuccess: (res) => {
      if (res.ok) onPosted(res.rank);
      else setError(res.error);
    },
    onError: () => setError("Could not post your score. Try again."),
  });

  if (posted) {
    return (
      <section className="drip-card rounded-3xl border-accent/40 p-6 text-center drip-rise">
        {posted.rank <= 3 ? (
          <p className="font-display text-xl font-extrabold uppercase tracking-[0.16em] text-accent">
            🔥 You made the leaderboard — {MEDALS[posted.rank - 1]} #{posted.rank}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            You&apos;re currently{" "}
            <span className="font-display text-base font-bold text-foreground">#{posted.rank}</span>{" "}
            today. Beat the score and try again.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="drip-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
          <Trophy className="mr-1.5 inline h-4 w-4 text-accent" />
          Add to Today&apos;s Leaderboard
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Posting as <span className="font-medium text-foreground">{identity.displayName}</span> · @
          {identity.username}
        </p>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
      <button
        className="drip-btn-primary disabled:opacity-50"
        disabled={submit.isPending}
        onClick={() => {
          setError(null);
          submit.mutate();
        }}
      >
        <Trophy className="h-4 w-4" />
        {submit.isPending ? "Posting…" : "Post My Score"}
      </button>
    </section>
  );
}