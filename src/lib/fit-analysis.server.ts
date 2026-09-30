/**
 * Server-only fashion analysis service.
 * Talks to the Lovable AI Gateway with a vision model. The API key never
 * leaves the server. Swap the model or provider here without touching the UI.
 *
 * Pipeline: several frames of one slow turn -> one model call over all of them
 * -> per-category visibility + score -> overall score computed HERE from the
 * visible categories only -> anything said about unseen categories dropped.
 * Used by both Live Check (personal) and the Rating Game (competitive), so the
 * two can never score the same outfit differently.
 */

import type { CategoryKey, Coverage, FitAnalysis, FramingCheck } from "./live-types";
import { BREAKDOWN_LABELS } from "./live-types";
import {
  deriveCoverage,
  dropUnseenAdvice,
  dropUnseenItems,
  normalizeCategory,
  visibleAverage,
} from "./fit-scoring";
export type { FitAnalysis, FitBreakdown, FitSuggestion } from "./live-types";

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_GATEWAY_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
/** Exported only as a label for callers building request bodies — the real
 * model choice per attempt happens in resolveProvider()/attempts below. */
export const MODEL = "gemini-3.5-flash-lite";

const SYSTEM_PROMPT = `You are DripCheck, a fashion styling analyst for a live outfit-scanning booth.

You receive several frames of the SAME person, captured a moment apart while they slowly
turn about 180 degrees in front of the camera (front, side, back). Treat all frames
together as ONE outfit.

You ONLY evaluate clothing and styling. You must NEVER assess, mention, infer or score:
face, attractiveness, body shape, weight, height, age, race, skin tone, gender or any
physical attribute of the person. Judge the garments, colours, layering, footwear,
accessories and overall styling only.

VISIBILITY IS THE MOST IMPORTANT RULE.
- A category is visible if it is clearly visible in AT LEAST ONE frame. Score it from
  its clearest view.
- If a category cannot be clearly seen in ANY frame, set visible:false and score 0.
  The app shows it as "Not Visible" and leaves it out of the overall score, so there is
  no penalty for it — which means there is never a reason to guess.
- If every frame is cropped at the waist, "bottom" and "shoes" are NOT visible.
- Never assume shoes exist because someone is standing.
- Never invent accessories. Mark accessories visible only if you can point at one
  (glasses, watch, chain, rings, cap, bag, belt, earrings...) in a frame.
- "layering" is visible only if you can see more than one layer, or clearly see a single
  layer covering the torso.
- If unsure, set visible:false. Guessing is worse than saying "not visible".

SCORING
- Score each visible category 1.0-10.0 with one decimal, on its own quality only.
- NEVER lower a visible category because a different category is not visible. A great
  top in a waist-up frame is still a great top.
- Most decent outfits land between 7.0 and 9.3.

visibleItems: short names of garments and accessories you can actually see in the frames
(e.g. "Black tee", "Denim jacket"). Never list anything you cannot see.

verdict: one or two short punchy sentences in a warm Gen-Z tone, describing ONLY what is
visible. Never reference items you cannot see.

suggestions: 2-3 short, punchy tips about the VISIBLE garments only. Each "text" must be
ONE short imperative line, under 10 words, no paragraphs, no "because" clauses. Style:
- "Tuck in the tee for a cleaner line."
- "Layer a jacket over this for more depth."
- "Add a watch to elevate the fit."
Never give advice about a category that is not visible — no shoe advice if shoes are not
visible, no trouser advice if the bottom is not visible.

If no person or clothing is visible in any frame, set every category visible:false,
styleLabel "No Fit Detected", and a verdict asking them to step into frame.`;

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
  required: ["styleLabel", "verdict", "occasion", "visibleItems", "breakdown", "suggestions"],
  properties: {
    styleLabel: {
      type: "string",
      description:
        "Short style name, e.g. Clean Streetwear, Minimal Core, Y2K Energy, Old Money, Casual Flex, Athleisure, Vintage Vibe, Techwear, Korean Soft",
    },
    verdict: { type: "string" },
    occasion: { type: "string", description: "Best occasion this fit suits, max 5 words" },
    visibleItems: { type: "array", maxItems: 6, items: { type: "string" } },
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
      maxItems: 3,
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
    // Lite is the primary now: the live check has a hard 13s wall-clock
    // budget and flash-lite finishes structured JSON output far faster than
    // the full flash tier. gemini-3.6-flash is the fallback — slower, but
    // used only if flash-lite is overloaded/unavailable on this key.
    return {
      url: GEMINI_GATEWAY_URL,
      apiKey: geminiKey,
      model: "gemini-3.5-flash-lite",
      fallbackModel: "gemini-3.6-flash",
    };
  }
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    // Same reasoning on the Lovable gateway: lite first for latency, regular
    // flash as the fallback if lite is overloaded.
    return {
      url: LOVABLE_GATEWAY_URL,
      apiKey: lovableKey,
      model: "google/gemini-3.5-flash-lite",
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
 * The product's ceiling is 13s end-to-end — this is that same 13s, since the
 * client's scan-duration floor runs in parallel with this call (not stacked
 * on top of it), so there's no extra time added outside this budget.
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
    throw new AnalysisError(
      "Could not reach the analysis service. Check your internet connection.",
      503,
    );
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
  const attempts: Array<{ model: string }> = [
    { model: provider.model },
    { model: provider.fallbackModel },
  ];

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
    console.error(
      `[ai-gateway] ${provider.url} (${attempt.model}) returned ${res.status}:`,
      text.slice(0, 1000),
    );
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

/**
 * Analyses one outfit from several frames of the same scan in a single model
 * call. Throws AnalysisError (422) when nothing wearable was visible in any
 * frame, rather than returning a meaningless low score.
 */
export async function analyzeOutfitFrames(frames: string[]): Promise<FitAnalysis> {
  if (frames.length === 0) {
    throw new AnalysisError("No frames were captured — make sure the camera is on.", 400);
  }

  const content = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `These are ${frames.length} frames of one outfit, in capture order, taken while the person turned. Analyze ONLY the clothing that is actually visible and return the scoring JSON.`,
          },
          ...frames.map((url) => ({ type: "image_url", image_url: { url } })),
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

  // The overall score is the mean of the visible categories — computed here,
  // never taken from the model, so an unseen category can't lower it.
  const dripScore = visibleAverage(CATEGORY_KEYS.map((k) => breakdown[k]));
  if (dripScore === null) {
    throw new AnalysisError(
      "We couldn't see an outfit in the scan — step into the frame and try again.",
      422,
    );
  }

  const seen = {
    shoes: breakdown.shoes.visible,
    bottom: breakdown.bottom.visible,
    accessories: breakdown.accessories.visible,
  };

  const coverage: Coverage = deriveCoverage({
    top: breakdown.top.visible,
    layering: breakdown.layering.visible,
    bottom: breakdown.bottom.visible,
    shoes: breakdown.shoes.visible,
    anything: true,
  });

  const visibleItems = dropUnseenItems(
    (Array.isArray(data["visibleItems"]) ? data["visibleItems"] : [])
      .map((v) => String(v).slice(0, 40).trim())
      .filter(Boolean),
    seen,
  ).slice(0, 6);

  const notVisible = BREAKDOWN_LABELS.filter(
    ({ key }) => key !== "overall" && !breakdown[key].visible,
  ).map(({ label }) => label);

  const suggestions = dropUnseenAdvice(
    (Array.isArray(data["suggestions"]) ? data["suggestions"] : [])
      .slice(0, 3)
      .map((s: { icon?: unknown; title?: unknown; text?: unknown }) => ({
        icon: String(s?.icon ?? "✨").slice(0, 4),
        title: String(s?.title ?? "Try this").slice(0, 40),
        text: String(s?.text ?? "").slice(0, 90),
      }))
      .filter((s) => s.text.length > 0),
    seen,
  );

  return {
    dripScore,
    styleLabel: String(data["styleLabel"] ?? "Everyday Fit").slice(0, 40),
    verdict: String(data["verdict"] ?? "Solid fit with room to level up.").slice(0, 300),
    occasion: String(data["occasion"] ?? "Everyday").slice(0, 40),
    coverage,
    partial: coverage !== "full",
    visibleItems,
    notVisible,
    breakdown,
    suggestions,
  };
}
