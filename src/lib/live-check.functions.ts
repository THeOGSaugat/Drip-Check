import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const analyzeInput = z.object({
  image: z
    .string()
    .startsWith("data:image/")
    .max(6_000_000, "Frame is too large — try again."),
  deviceKey: z.string().min(8).max(64),
});

const submitInput = z.object({
  deviceKey: z.string().min(8).max(64),
  displayName: z.string().trim().min(2).max(40),
  username: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only use letters, numbers, . _ -"),
  dripScore: z.number().min(1).max(10),
  styleLabel: z.string().max(40),
  verdict: z.string().max(300).optional(),
  breakdown: z.record(z.string(), z.number()).optional(),
});

export const analyzeFit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => analyzeInput.parse(data))
  .handler(async ({ data }) => {
    const { analyzeOutfitImage, AnalysisError } = await import("./fit-analysis.server");
    const { checkAnalysisRate } = await import("./live-rate-limit.server");

    const gate = checkAnalysisRate(data.deviceKey);
    if (!gate.ok) {
      return { ok: false as const, error: gate.message };
    }

    try {
      const analysis = await analyzeOutfitImage(data.image);
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
        deviceKey: z.string().min(8).max(64),
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

export const getLiveLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("live_scores")
    .select("id, display_name, username, drip_score, style_label, created_at")
    .gte("created_at", since)
    .order("drip_score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[live-check] leaderboard read failed", error);
    return { entries: [] };
  }

  return {
    entries: (data ?? []).map((row, i) => ({
      id: row.id,
      rank: i + 1,
      displayName: row.display_name,
      username: row.username,
      dripScore: Number(row.drip_score),
      styleLabel: row.style_label,
    })),
  };
});

export const submitLiveScore = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { checkSubmitRate } = await import("./live-rate-limit.server");

    const gate = checkSubmitRate(data.deviceKey);
    if (!gate.ok) return { ok: false as const, error: gate.message };

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("live_scores")
      .select("id", { count: "exact", head: true })
      .eq("device_key", data.deviceKey)
      .gte("created_at", since);

    if ((count ?? 0) >= 5) {
      return {
        ok: false as const,
        error: "This device already posted 5 fits this hour. Let someone else have a go.",
      };
    }

    const { error } = await supabaseAdmin.from("live_scores").insert({
      device_key: data.deviceKey,
      display_name: data.displayName,
      username: data.username.replace(/^@/, ""),
      drip_score: data.dripScore,
      style_label: data.styleLabel,
      verdict: data.verdict ?? null,
      breakdown: data.breakdown ?? {},
    });

    if (error) {
      console.error("[live-check] submit failed", error);
      return { ok: false as const, error: "Could not save your score. Try again." };
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: better } = await supabaseAdmin
      .from("live_scores")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayAgo)
      .gt("drip_score", data.dripScore);

    return { ok: true as const, rank: (better ?? 0) + 1 };
  });
