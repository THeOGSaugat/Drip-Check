import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const compareInput = z.object({
  myImage: z
    .string()
    .startsWith("data:image/")
    .max(8_000_000, "Your photo is too large — try a smaller one."),
  targetImage: z
    .string()
    .startsWith("data:image/")
    .max(8_000_000, "That fit's image is too large."),
  deviceKey: z.string().min(8).max(64),
});

export const compareFitToMyStyle = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => compareInput.parse(data))
  .handler(async ({ data }) => {
    const { compareOutfitStyles } = await import("./compare-analysis.server");
    const { AnalysisError } = await import("./fit-analysis.server");
    const { checkAnalysisRate } = await import("./live-rate-limit.server");

    const gate = checkAnalysisRate(data.deviceKey);
    if (!gate.ok) return { ok: false as const, error: gate.message };

    try {
      const verdict = await compareOutfitStyles(data.myImage, data.targetImage);
      return { ok: true as const, verdict };
    } catch (error) {
      const message =
        error instanceof AnalysisError
          ? error.message
          : "Comparison failed. Try a clearer, well-lit photo.";
      console.error("[compare] comparison failed", error);
      return { ok: false as const, error: message };
    }
  });
