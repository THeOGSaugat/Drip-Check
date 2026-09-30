import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Maximize2, Minimize2, Music, Sparkles, VolumeX, X } from "lucide-react";
import { BodyGuide, CameraFrame, ScanOverlay } from "@/components/live/ScanOverlay";
import { checkFitFraming } from "@/lib/live-check.functions";
import { captureFrame, getDeviceKey } from "@/lib/live-client";
import type { FramingCheck } from "@/lib/live-types";
import { cn } from "@/lib/utils";
import liveCheckTheme from "@/assets/audio/live-check-theme.mp3";

type Phase = "idle" | "countdown" | "scanning" | "analyzing" | "result";

/** ~6.5s — long enough to turn slowly through about 180°. */
const SCAN_MS = 6_500;
const SCAN_STEPS = [
  "Face the camera",
  "Turn slowly to your side",
  "Keep turning — show the back",
  "Hold it, then face front",
] as const;
const SCAN_STEP_MS = SCAN_MS / SCAN_STEPS.length;
/** One frame from the middle of each step: front, side, back, and the return. */
const FRAME_AT_MS = SCAN_STEPS.map((_, i) => Math.round((i + 0.5) * SCAN_STEP_MS));

export type ScanOutcome = { ok: true } | { ok: false; error: string };

/**
 * The camera booth shared by Live Check (personal) and the Rating Game
 * (competitive): real camera with a mirrored preview, fullscreen, framing
 * check, countdown, a guided ~6.5s turn that captures several frames, and the
 * live-check background music. What happens to the frames is the page's job.
 */
export function ScanBooth({
  onScan,
  renderResult,
  aside,
  stageLabel,
  startLabel,
  idleNote,
}: {
  /** Receives the scan's frames. Resolve ok:true once the page has a result to show. */
  onScan: (frames: string[]) => Promise<ScanOutcome>;
  /** Rendered under the camera after a successful scan. `again` returns to idle. */
  renderResult: (again: () => void) => ReactNode;
  aside: ReactNode;
  stageLabel: string;
  startLabel: string;
  idleNote: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const framesRef = useRef<string[]>([]);
  // Bumped when a scan starts or the camera stops; a result that comes back
  // for an older run is ignored instead of clobbering the current state.
  const runRef = useRef(0);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const [camera, setCamera] = useState<"off" | "starting" | "on" | "denied">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [framing, setFraming] = useState<FramingCheck | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [musicOn, setMusicOn] = useState(true);

  // Background music plays from "Start" through the analysis — never during
  // the result. Kept as plain ref-driven play()/pause() so playback starts
  // directly inside a click (Start, or switching music back on mid-scan),
  // which is what browsers require before audio with sound may play.
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

  const inProgress = phase === "countdown" || phase === "scanning" || phase === "analyzing";

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    if (!next) stopMusic();
    else if (inProgress) playMusic();
  };

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

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    runRef.current += 1;
    setCamera("off");
    setPhase((p) => (p === "result" ? p : "idle"));
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

  const startCheck = () => {
    if (camera !== "on" || phase !== "idle") return;
    setError(null);
    setCount(3);
    setPhase("countdown");
    if (musicOn) playMusic();
  };

  // Countdown → scanning
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) {
      setPhase("scanning");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, count]);

  // Scanning: guide the turn, grab a frame mid-way through each step, then
  // hand every frame to the page for analysis in one request.
  useEffect(() => {
    if (phase !== "scanning") return;
    const run = ++runRef.current;
    framesRef.current = [];
    setScanStep(0);

    const settle = (outcome: ScanOutcome) => {
      if (runRef.current !== run) return;
      stopMusic();
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      if (outcome.ok) {
        setPhase("result");
      } else {
        setError(outcome.error);
        setPhase("idle");
      }
    };

    const grabs = FRAME_AT_MS.map((at) =>
      setTimeout(() => {
        const video = videoRef.current;
        const frame = video ? captureFrame(video) : null;
        if (frame) framesRef.current.push(frame);
      }, at),
    );
    const steps = setInterval(
      () => setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)),
      SCAN_STEP_MS,
    );
    const done = setTimeout(() => {
      const frames = framesRef.current.slice();
      setPhase("analyzing");
      if (frames.length === 0) {
        settle({
          ok: false,
          error: "The camera didn't give us any frames — check it's on and try again.",
        });
        return;
      }
      onScanRef
        .current(frames)
        .then(settle, () =>
          settle({ ok: false, error: "Analysis failed. Check your connection and try again." }),
        );
    }, SCAN_MS);

    return () => {
      grabs.forEach(clearTimeout);
      clearInterval(steps);
      clearTimeout(done);
    };
  }, [phase, stopMusic]);

  const again = useCallback(() => {
    setError(null);
    setPhase("idle");
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <audio ref={audioRef} src={liveCheckTheme} loop preload="auto" className="hidden" />

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
                  "We need your camera to check the fit. Frames from your scan are analyzed, then discarded — no photos are stored."}
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

          <button
            type="button"
            onClick={toggleMusic}
            aria-pressed={musicOn}
            aria-label={musicOn ? "Turn background music off" : "Turn background music on"}
            className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/75 px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] backdrop-blur transition-colors hover:border-accent/60"
          >
            {musicOn ? (
              <Music className="h-3.5 w-3.5 text-accent" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {musicOn ? "Music on" : "Music off"}
          </button>

          {camera === "on" && (
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="absolute bottom-4 right-4 z-10 rounded-full border border-border bg-background/75 p-2.5 backdrop-blur transition-colors hover:border-accent/60"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <span className="drip-chip font-display text-[0.65rem] uppercase tracking-[0.3em]">
              {stageLabel}
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
                className="drip-count font-display text-8xl font-extrabold text-accent"
              >
                {count === 0 ? "GO" : count}
              </span>
            </div>
          )}

          {phase === "scanning" && <ScanOverlay label={SCAN_STEPS[scanStep] ?? SCAN_STEPS[0]} />}
          {phase === "analyzing" && <ScanOverlay label="Analyzing your fit…" />}
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
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
              {phase === "idle" ? startLabel : phase === "analyzing" ? "Analyzing…" : "Scanning…"}
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
            {camera === "on" && phase !== "analyzing" && (
              <button className="drip-btn-ghost" onClick={stopCamera}>
                Turn Camera Off
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {phase === "scanning" || phase === "countdown"
                ? "Turn slowly — we're capturing a few frames of your fit."
                : phase === "analyzing"
                  ? "Analysis running on the server right now."
                  : idleNote}
            </span>
          </div>
        )}

        {phase === "result" && renderResult(again)}
      </div>

      {aside}
    </div>
  );
}
