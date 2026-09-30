/**
 * Live Check — PERSONAL. Analyses a scan and returns the result. Nothing is
 * written to the database here: Live Check has no path to the leaderboard.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deviceKeyInput, scanFramesInput } from "./scan-schema";

export const analyzeFit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ frames: scanFramesInput, deviceKey: deviceKeyInput }).parse(data),
  )
  .handler(async ({ data }) => {
    const { analyzeOutfitFrames, AnalysisError } = await import("./fit-analysis.server");
    const { checkAnalysisRate } = await import("./live-rate-limit.server");

    const gate = checkAnalysisRate(data.deviceKey);
    if (!gate.ok) {
      return { ok: false as const, error: gate.message };
    }

    try {
      const analysis = await analyzeOutfitFrames(data.frames);
      return { ok: true as const, analysis };
    } catch (error) {
      const message =
        error instanceof AnalysisError
          ? error.message
          : "Analysis failed. Check the lighting and try again.";
      console.error("[live-check] analysis failed", error);
      return { ok: false as const, error: message };
    }
  });

/** Lightweight framing pre-check: tells the user how to stand before the real check. */
export const checkFitFraming = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        image: z.string().startsWith("data:image/").max(6_000_000),
        deviceKey: deviceKeyInput,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { checkFraming, AnalysisError } = await import("./fit-analysis.server");
    const { checkFramingRate } = await import("./live-rate-limit.server");

    const gate = checkFramingRate(data.deviceKey);
    if (!gate.ok) return { ok: false as const, error: gate.message };

    try {
      return { ok: true as const, framing: await checkFraming(data.image) };
    } catch (error) {
      const message =
        error instanceof AnalysisError ? error.message : "Framing check failed. Try again.";
      console.error("[live-check] framing check failed", error);
      return { ok: false as const, error: message };
    }
  });
