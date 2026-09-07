import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const photoInput = z.object({
  image: z
    .string()
    .startsWith("data:image/")
    .max(8_000_000, "Image is too large — try a smaller photo."),
  deviceKey: z.string().min(8).max(64),
});

export const analyzePhotoFit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => photoInput.parse(data))
  .handler(async ({ data }) => {
    const { analyzeOutfitPhoto } = await import("./photo-analysis.server");
    const { AnalysisError } = await import("./fit-analysis.server");
    const { checkAnalysisRate } = await import("./live-rate-limit.server");

    const gate = checkAnalysisRate(data.deviceKey);
    if (!gate.ok) return { ok: false as const, error: gate.message };

    try {
      return { ok: true as const, analysis: await analyzeOutfitPhoto(data.image) };
    } catch (error) {
      const message =
        error instanceof AnalysisError
          ? error.message
          : "Analysis failed. Try a clearer, well-lit photo.";
      console.error("[photo-check] analysis failed", error);
      return { ok: false as const, error: message };
    }
  });
