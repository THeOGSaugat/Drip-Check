/**
 * Server-only fashion analysis service.
 * Talks to the Lovable AI Gateway with a vision model. The API key never
 * leaves the server. Swap the model or provider here without touching the UI.
 *
 * Pipeline: frame -> person detection -> visible clothing detection ->
 * visible category detection -> score ONLY visible categories -> suggestions
 * derived only from what was actually seen.
 */

import type { CategoryKey, CategoryScore, Coverage, FitAnalysis, FramingCheck } from "./live-types";
export type { FitAnalysis, FitBreakdown, FitSuggestion } from "./live-types";

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_GATEWAY_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
/** Exported only as a label for callers building request bodies — the real
 * model choice per attempt happens in resolveProvider()/attempts below. */
export const MODEL = "gemini-3.6-flash";

const SYSTEM_PROMPT = `You are DripCheck, a fashion styling analyst for a live outfit-scoring booth.

You ONLY evaluate clothing and styling. You must NEVER assess, mention, infer or score:
face, attractiveness, body shape, weight, height, age, race, skin tone, gender or any
physical attribute of the person. Judge the garments, colours, layering, footwear,
accessories and overall styling only.

VISIBILITY IS THE MOST IMPORTANT RULE.
Score a category ONLY if you can actually SEE it in this single frame.
- If the frame is cropped at the waist, "bottom" and "shoes" are NOT visible.
- Never assume shoes exist because someone is standing.
- Never invent accessories. Only mark accessories visible if you can point at one
  (glasses, watch, chain, rings, cap, bag, belt, earrings...).
- "layering" is visible only if you can see more than one layer or clearly see there is
  a single layer covering the visible torso.
- If unsure, set visible:false. Guessing is worse than saying "not visible".

For every category return { visible, score }. When visible is false, set score to 0 and
the app will display "Not visible".

coverage: "full" when torso AND legs AND feet are visible, "upper" when only the upper
body is visible, "lower" when only the lower body is visible, "none" when no person or
clothing is visible.

dripScore must be the average of the VISIBLE category scores only, 1.0-10.0 with one
decimal. Most decent outfits land between 7.0 and 9.3.

visibleItems: short names of garments you can actually see (e.g. "Black tee", "Denim jacket").
notVisible: short names of categories you could not see (e.g. "Shoes", "Accessories").

verdict: one or two short punchy sentences in a warm Gen-Z tone, describing ONLY what is
visible. Never reference items you cannot see.

suggestions: 2-4 concrete tips based only on visible garments. If shoes are not visible,
one suggestion must be "Show your full fit to get footwear recommendations." If
accessories are not visible, one suggestion may say accessories aren't clearly visible.
Never say "try different shoes" when shoes are not visible.

If no person or clothing is visible, return coverage "none", dripScore 1.0, styleLabel
"No Fit Detected", every category visible:false, and a verdict asking them to step into frame.`;

const CATEGORY_KEYS: CategoryKey[] = [
  "style",
  "colorCoordination",
  "top",
  "bottom",
  "layering",
  "shoes",
  "accessories",
  "overall",
];

const categoryProp = {
  type: "object",
  additionalProperties: false,
  required: ["visible", "score"],
  properties: {
    visible: { type: "boolean", description: "true only if clearly visible in the frame" },
    score: { type: "number", description: "1.0-10.0, or 0 when visible is false" },
  },
} as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "dripScore",
    "styleLabel",
    "verdict",
    "occasion",
    "coverage",
    "visibleItems",
    "notVisible",
    "breakdown",
    "suggestions",
  ],
  properties: {
    dripScore: { type: "number" },
    styleLabel: {
      type: "string",
      description:
        "Short style name, e.g. Clean Streetwear, Minimal Core, Y2K Energy, Old Money, Casual Flex, Athleisure, Vintage Vibe, Techwear, Korean Soft",
    },
    verdict: { type: "string" },
    occasion: { type: "string", description: "Best occasion this fit suits, max 5 words" },
    coverage: { type: "string", enum: ["full", "upper", "lower", "none"] },
    visibleItems: { type: "array", maxItems: 6, items: { type: "string" } },
    notVisible: { type: "array", maxItems: 6, items: { type: "string" } },
    breakdown: {
      type: "object",
      additionalProperties: false,
      required: CATEGORY_KEYS as unknown as string[],
      properties: {
        style: categoryProp,
        colorCoordination: categoryProp,
        top: categoryProp,
        bottom: categoryProp,
        layering: categoryProp,
        shoes: categoryProp,
        accessories: categoryProp,
        overall: categoryProp,
      },
    },
    suggestions: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["icon", "title", "text"],
        properties: {
          icon: { type: "string", description: "A single emoji" },
          title: { type: "string", description: "2-3 word label, e.g. Try this" },
          text: { type: "string" },
        },
      },
    },
  },
} as const;

const FRAMING_SYSTEM_PROMPT = `You are the framing assistant for a live outfit-scanning booth.
Look at the camera frame and report ONLY which parts of the person are inside the frame.
Never describe or judge the person. Answer strictly about framing:
head (face/hair area), torso (chest to waist), lowerBody (hips to ankles), feet (shoes).
readyForFullCheck is true only when torso, lowerBody and feet are all visible.
message: one short friendly instruction, e.g. "Step back so we can see your shoes",
"Move back to show your full fit", or "Perfect. Ready?" when framing is good.`;

const FRAMING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["personVisible", "head", "torso", "lowerBody", "feet", "message"],
  properties: {
    personVisible: { type: "boolean" },
    head: { type: "boolean" },
    torso: { type: "boolean" },
    lowerBody: { type: "boolean" },
    feet: { type: "boolean" },
    message: { type: "string" },
  },
} as const;

function clampScore(n: unknown, fallback = 7.5): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.round(Math.min(10, Math.max(1, v)) * 10) / 10;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("The analyzer returned an unreadable response.");
  }
}

export class AnalysisError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Picks whichever AI provider is configured for this environment.
 * - GEMINI_API_KEY: calls Google's Gemini API directly (local dev, your own key).
 * - LOVABLE_API_KEY: calls the Lovable AI Gateway (Lovable Cloud only).
 * `fallbackModel` is tried if the primary model is overloaded (503/UNAVAILABLE).
 */
function resolveProvider(): { url: string; apiKey: string; model: string; fallbackModel: string } {
  const geminiKey = process.env["GEMINI_API_KEY"];
  if (geminiKey) {
    // A personal Gemini key has no pooled capacity behind it, so the newest
    // flash model returns 503 "high demand" often. gemini-2.5-flash is
    // retired for new API keys (Google's API returns 404 NOT_FOUND and
    // points to 3.6), so 3.6-flash is the stable primary; 3.7-flash (the
    // newest) is only tried as a fallback.
    return {
      url: GEMINI_GATEWAY_URL,
      apiKey: geminiKey,
      model: "gemini-3.6-flash",
      fallbackModel: "gemini-3.7-flash",
    };
  }
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    // Lovable's gateway pools capacity across many users, so the newest
    // model is worth trying first there for the better analysis quality.
    return {
      url: LOVABLE_GATEWAY_URL,
      apiKey: lovableKey,
      model: "google/gemini-3.7-flash",
      fallbackModel: "google/gemini-3.6-flash",
    };
  }
  throw new AnalysisError(
    "No AI provider configured. Set GEMINI_API_KEY (or connect Lovable AI) to enable fit analysis.",
    500,
  );
}

/**
 * Total wall-clock budget for one check, covering every attempt combined.
 * Kept comfortably under the 15s ceiling the product wants end-to-end, since
 * a little time outside this function (image transfer, our own request
 * handling) also counts against what the person standing at the camera
 * actually experiences.
 */
const TOTAL_BUDGET_MS = 13_000;
/** Below this much remaining budget, a fresh attempt has no realistic chance
 * of finishing in time — stop instead of starting one that will just abort. */
const MIN_USEFUL_ATTEMPT_MS = 2_500;

async function doFetch(
  url: string,
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...body, model }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[ai-gateway] request to ${url} (${model}) timed out after ${timeoutMs}ms`);
      throw new AnalysisError("The analysis service took too long to respond. Try again.", 504);
    }
    console.error(`[ai-gateway] fetch to ${url} failed:`, err);
    throw new AnalysisError("Could not reach the analysis service. Check your internet connection.", 503);
  } finally {
    clearTimeout(timeout);
  }
}

function isOverloaded(status: number, text: string): boolean {
  return status === 503 || /UNAVAILABLE|overloaded|high demand/i.test(text);
}

export async function callGateway(body: Record<string, unknown>): Promise<string> {
  const provider = resolveProvider();
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  // Primary model first, then the fallback — but only if there's still
  // meaningfully enough of the shared time budget left. A fast 429/503
  // rejection barely dents the budget, so there's usually still room for a
  // fallback try; a real network stall/timeout eats the whole budget by
  // definition, so there's nothing left to retry with — and that's the
  // point: total time is capped no matter what happens.
  const attempts: Array<{ model: string }> = [{ model: provider.model }, { model: provider.fallbackModel }];

  let lastError: { status: number; text: string } | null = null;

  for (const attempt of attempts) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_USEFUL_ATTEMPT_MS) break;

    let res: Response;
    try {
      res = await doFetch(provider.url, provider.apiKey, attempt.model, body, remaining);
    } catch (err) {
      // A timeout (or network failure) shouldn't abort the whole chain — treat
      // it like a transient overload and let the loop try the next attempt,
      // if the budget check above still allows one.
      if (err instanceof AnalysisError) {
        lastError = { status: err.status, text: err.message };
        continue;
      }
      throw err;
    }

    if (res.ok) {
      const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new AnalysisError("The analyzer returned an empty response.", 502);
      return content;
    }

    const text = await res.text();
    console.error(`[ai-gateway] ${provider.url} (${attempt.model}) returned ${res.status}:`, text.slice(0, 1000));
    lastError = { status: res.status, text };

    // Only worth retrying/falling back on transient overload; anything else (bad
    // key, quota, malformed request) will fail the same way again — stop early.
    if (!isOverloaded(res.status, text)) break;
  }

  const { status, text } = lastError!;
  let message = `Analysis failed (${status}). Try again.`;
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
    message = parsed.error?.message ?? parsed.message ?? message;
  } catch {
    /* upstream sent a non-JSON body (e.g. an HTML error page) — see console for the raw text */
  }
  if (status === 429) message = "Too many checks right now — give it a few seconds.";
  if (status === 402) message = "AI credits are exhausted. Top up to keep checking fits.";
  if (status === 401 || status === 403) {
    message =
      "The AI key was rejected — check GEMINI_API_KEY is correct and the Generative Language API is enabled for it.";
  }
  if (isOverloaded(status, text)) {
    message = "Google's AI servers are busy right now — please try the check again in a moment.";
  }
  if (status === 504) {
    message = "The analysis service is slow to respond right now — please try again in a moment.";
  }
  throw new AnalysisError(message, status);
}

/** Cheap pre-check: is enough of the outfit inside the frame to run a full check? */
export async function checkFraming(imageDataUrl: string): Promise<FramingCheck> {
  const content = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: FRAMING_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Report which parts of the person are inside this frame." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "framing_check", strict: true, schema: FRAMING_SCHEMA },
    },
  });

  const d = parseJson(content) as Partial<FramingCheck>;
  const personVisible = Boolean(d.personVisible);
  const head = Boolean(d.head);
  const torso = Boolean(d.torso);
  const lowerBody = Boolean(d.lowerBody);
  const feet = Boolean(d.feet);

  const coverage: Coverage = !personVisible
    ? "none"
    : torso && lowerBody && feet
      ? "full"
      : torso
        ? "upper"
        : lowerBody || feet
          ? "lower"
          : "none";

  const readyForFullCheck = coverage === "full";
  const fallbackMessage = !personVisible
    ? "Step into frame so we can see your fit."
    : readyForFullCheck
      ? "Perfect. Ready?"
      : !feet
        ? "Step back — we can't see your shoes yet."
        : "Move back so we can see your full fit.";

  return {
    personVisible,
    head,
    torso,
    lowerBody,
    feet,
    coverage,
    readyForFullCheck,
    message: String(d.message ?? fallbackMessage).slice(0, 120) || fallbackMessage,
  };
}

function normalizeCategory(raw: unknown): CategoryScore {
  const c = (raw ?? {}) as { visible?: unknown; score?: unknown };
  const visible = Boolean(c.visible);
  if (!visible) return { visible: false, score: null };
  const score = clampScore(c.score, 7.5);
  return { visible: true, score };
}

export async function analyzeOutfitImage(imageDataUrl: string): Promise<FitAnalysis> {
  const content = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze ONLY the clothing that is actually visible in this frame and return the scoring JSON.",
          },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "fit_analysis", strict: true, schema: SCHEMA },
    },
  });

  const data = parseJson(content) as Record<string, unknown>;
  const rawBreakdown = (data["breakdown"] ?? {}) as Record<string, unknown>;

  const breakdown = Object.fromEntries(
    CATEGORY_KEYS.map((key) => [key, normalizeCategory(rawBreakdown[key])]),
  ) as FitAnalysis["breakdown"];

  const visibleScores = CATEGORY_KEYS.map((k) => breakdown[k]).filter(
    (c): c is { visible: true; score: number } => c.visible && typeof c.score === "number",
  );

  const coverageRaw = String(data["coverage"] ?? "");
  const coverage: Coverage = (["full", "upper", "lower", "none"] as const).includes(
    coverageRaw as Coverage,
  )
    ? (coverageRaw as Coverage)
    : visibleScores.length === 0
      ? "none"
      : breakdown.shoes.visible && breakdown.bottom.visible
        ? "full"
        : "upper";

  const average =
    visibleScores.length > 0
      ? visibleScores.reduce((sum, c) => sum + c.score, 0) / visibleScores.length
      : 1;

  const toList = (v: unknown) =>
    (Array.isArray(v) ? v : [])
      .map((s) => String(s).slice(0, 40))
      .filter(Boolean)
      .slice(0, 6);

  const notVisibleFromBreakdown = CATEGORY_KEYS.filter((k) => !breakdown[k].visible).map((k) =>
    k === "colorCoordination" ? "Colors" : k.charAt(0).toUpperCase() + k.slice(1),
  );

  const suggestions = (Array.isArray(data["suggestions"]) ? data["suggestions"] : [])
    .slice(0, 4)
    .map((s: { icon?: unknown; title?: unknown; text?: unknown }) => ({
      icon: String(s?.icon ?? "✨").slice(0, 4),
      title: String(s?.title ?? "Try this").slice(0, 40),
      text: String(s?.text ?? "").slice(0, 220),
    }))
    .filter((s) => s.text.length > 0);

  if (!breakdown.shoes.visible && !suggestions.some((s) => /full fit/i.test(s.text))) {
    suggestions.push({
      icon: "👟",
      title: "Show your shoes",
      text: "Show your full fit to get footwear recommendations.",
    });
  }

  return {
    dripScore:
      coverage === "none" ? 1 : clampScore(data["dripScore"], Math.round(average * 10) / 10),
    styleLabel: String(data["styleLabel"] ?? "Everyday Fit").slice(0, 40),
    verdict: String(data["verdict"] ?? "Solid fit with room to level up.").slice(0, 300),
    occasion: String(data["occasion"] ?? "Everyday").slice(0, 40),
    coverage,
    partial: coverage !== "full",
    visibleItems: toList(data["visibleItems"]),
    notVisible: toList(data["notVisible"]).length
      ? toList(data["notVisible"])
      : notVisibleFromBreakdown,
    breakdown,
    suggestions: suggestions.slice(0, 4),
  };
}