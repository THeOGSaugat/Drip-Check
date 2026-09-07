import { useCallback, useEffect, useState } from "react";

const DEVICE_KEY = "dripcheck.device-key";
const SHOWCASE_KEY = "dripcheck.showcase-mode";

export function getDeviceKey(): string {
  if (typeof window === "undefined") return "server-side-device-key";
  let key = window.localStorage.getItem(DEVICE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, key);
  }
  return key;
}

export function useShowcaseMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(window.localStorage.getItem(SHOWCASE_KEY) === "1");
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(SHOWCASE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return { showcase: enabled, toggleShowcase: toggle };
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
