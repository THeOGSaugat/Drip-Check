const DEVICE_KEY = "dripcheck.device-key";

export function getDeviceKey(): string {
  if (typeof window === "undefined") return "server-side-device-key";
  let key = window.localStorage.getItem(DEVICE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, key);
  }
  return key;
}

/** Shares (or copies) a one-line result. Returns false if nothing happened. */
export async function shareFitResult(score: number, styleLabel: string): Promise<boolean> {
  const text = `I scored ${score.toFixed(1)} 🔥 on DripCheck — ${styleLabel}`;
  try {
    if (navigator.share) await navigator.share({ title: "DripCheck", text });
    else await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // dismissed or unavailable
  }
}

/** Grabs a JPEG frame from a live video element, downscaled for upload. */
export function captureFrame(video: HTMLVideoElement, maxWidth = 720): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const scale = Math.min(1, maxWidth / vw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}
