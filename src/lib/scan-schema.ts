import { z } from "zod";
import { MAX_TZ_OFFSET_MINUTES } from "./leaderboard-day";

/** Frames from one camera scan (Live Check and Rating Game). */
export const scanFramesInput = z
  .array(
    z.string().startsWith("data:image/").max(2_500_000, "A scan frame is too large — try again."),
  )
  .min(1, "No frames were captured — make sure the camera is on.")
  .max(6, "Too many frames in one scan.");

export const deviceKeyInput = z.string().min(8).max(64);

/** The browser's Date#getTimezoneOffset(), so "today" means the viewer's today. */
export const tzOffsetInput = z
  .number()
  .int()
  .min(-MAX_TZ_OFFSET_MINUTES)
  .max(MAX_TZ_OFFSET_MINUTES);
