/**
 * Server-only photo analysis service for /check.
 * Isolated from all UI code. Talks to the Lovable AI Gateway vision model;
 * the API key never leaves the server. Swap provider/model here only.
 */

import { AnalysisError, callGateway, MODEL } from "./fit-analysis.server";
import {
  dropUnseenAdvice,
  dropUnseenItems,
  normalizeCategory,
  visibleAverage,
} from "./fit-scoring";
import type { PhotoAnalysis, PhotoBreakdown, PhotoCategoryKey } from "./photo-types";
import { PHOTO_BREAKDOWN_LABELS } from "./photo-types";

const SYSTEM_PROMPT = `You are DripCheck, a fashion styling analyst reviewing a single uploaded outfit photo.

You ONLY evaluate clothing and styling. You must NEVER assess, mention, infer or score:
face, attractiveness, body shape, weight, height, age, race, skin tone, gender or any
physical attribute of the person. Judge garments, colours, layering, footwear,
accessories and overall styling only.

VISIBILITY RULE: score a category only if you can actually SEE it in the photo.
If the photo is cropped at the waist, shoes are NOT visible. Never invent accessories.
When a category is not visible set visible:false and score 0 — the app shows it as
"Not Visible" and leaves it out of the overall score, so there is no reason to guess.
Score each visible category 1.0-10.0 on its own quality; NEVER lower one because a
different category is not visible.

styleLabel: short style name, e.g. Clean Streetwear, Minimal Core, Y2K Energy, Old Money.
summary: 1-2 calm sentences describing only the visible outfit direction.
working: 2-3 short positive observations about what actually works — visible items only.
levelUp: 3 constructive, concrete suggestions (title 2-4 words + one sentence) about the
visible outfit only. No shoe advice if shoes are not visible.
palette: the dominant garment colours you can see (2-5), name plus closest hex.
combos: 2-3 recommended colour pairings, formatted like "Black + Cream".
styleMatch: 3 style families with a 0-100 percent match, highest first.
visibleItems: garments you can see. Never list anything you cannot see.
notVisible: parts of the outfit you could not see (e.g. "Shoes", "Bottom").

If no person or clothing is visible, set every category visible:false,
styleLabel "No Fit Detected" and say so in the summary.`;

const categoryProp = {
  type: "object",
  additionalProperties: false,
  required: ["visible", "score"],
  properties: {
    visible: { type: "boolean" },
    score: { type: "number" },
  },
} as const;

const KEYS: PhotoCategoryKey[] = ["style", "colors", "coordination", "shoes", "accessories"];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "styleLabel",
    "summary",
    "occasion",
    "visibleItems",
    "notVisible",
    "breakdown",
    "working",
    "levelUp",
    "palette",
    "combos",
    "styleMatch",
  ],
  properties: {
    styleLabel: { type: "string" },
    summary: { type: "string" },
    occasion: { type: "string" },
    visibleItems: { type: "array", maxItems: 6, items: { type: "string" } },
    notVisible: { type: "array", maxItems: 6, items: { type: "string" } },
    breakdown: {
      type: "object",
      additionalProperties: false,
      required: KEYS as unknown as string[],
      properties: {
        style: categoryProp,
        colors: categoryProp,
        coordination: categoryProp,
        shoes: categoryProp,
        accessories: categoryProp,
      },
    },
    working: { type: "array", minItems: 2, maxItems: 3, items: { type: "string" } },
    levelUp: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "text"],
        properties: { title: { type: "string" }, text: { type: "string" } },
      },
    },
    palette: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "hex"],
        properties: {
          name: { type: "string" },
          hex: { type: "string", description: "#rrggbb" },
        },
      },
    },
    combos: { type: "array", minItems: 2, maxItems: 3, items: { type: "string" } },
    styleMatch: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "percent"],
        properties: { label: { type: "string" }, percent: { type: "number" } },
      },
    },
  },
} as const;

function parseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new AnalysisError("The analyzer returned an unreadable response.", 502);
  }
}

const text = (v: unknown, fallback: string, max: number) =>
  String(v ?? fallback).slice(0, max) || fallback;

const list = (v: unknown, max: number, len = 60) =>
  (Array.isArray(v) ? v : [])
    .map((s) => String(s).slice(0, len).trim())
    .filter(Boolean)
    .slice(0, max);

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function analyzeOutfitPhoto(imageDataUrl: string): Promise<PhotoAnalysis> {
  const content = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze ONLY the clothing visible in this photo and return the styling JSON.",
          },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "photo_fit_analysis", strict: true, schema: SCHEMA },
    },
  });

  const data = parseJson(content);
  const rawBreakdown = (data["breakdown"] ?? {}) as Record<string, unknown>;
  const breakdown = Object.fromEntries(
    KEYS.map((k) => [k, normalizeCategory(rawBreakdown[k])]),
  ) as PhotoBreakdown;

  // Overall = mean of the visible categories only, computed here rather than
  // taken from the model, so an unseen category can never lower it.
  const dripScore = visibleAverage(KEYS.map((k) => breakdown[k]));
  if (dripScore === null) {
    throw new AnalysisError(
      "We couldn't see an outfit in this photo — try a clearer, well-lit fit pic.",
      422,
    );
  }

  const seen = { shoes: breakdown.shoes.visible, accessories: breakdown.accessories.visible };

  // Categories we scored as unseen, plus any extra parts the model reports
  // (e.g. "Bottom"), minus anything that contradicts a category it DID see.
  const visibleLabels = PHOTO_BREAKDOWN_LABELS.filter(({ key }) => breakdown[key].visible).map(
    ({ label }) => label.toLowerCase(),
  );
  const notVisible = [
    ...PHOTO_BREAKDOWN_LABELS.filter(({ key }) => !breakdown[key].visible).map(
      ({ label }) => label,
    ),
    ...list(data["notVisible"], 6, 40),
  ].filter(
    (item, i, all) =>
      !visibleLabels.includes(item.toLowerCase()) &&
      all.findIndex((x) => x.toLowerCase() === item.toLowerCase()) === i,
  );

  const palette = (Array.isArray(data["palette"]) ? data["palette"] : [])
    .slice(0, 5)
    .map((p: { name?: unknown; hex?: unknown }) => ({
      name: text(p?.name, "Neutral", 18),
      hex: HEX.test(String(p?.hex ?? "")) ? String(p.hex) : "#8a8a8a",
    }));

  const levelUp = dropUnseenAdvice(
    (Array.isArray(data["levelUp"]) ? data["levelUp"] : [])
      .slice(0, 3)
      .map((t: { title?: unknown; text?: unknown }) => ({
        title: text(t?.title, "Try this", 40),
        text: text(t?.text, "", 220),
      }))
      .filter((t) => t.text.length > 0),
    seen,
  );

  const styleMatch = (Array.isArray(data["styleMatch"]) ? data["styleMatch"] : [])
    .slice(0, 3)
    .map((m: { label?: unknown; percent?: unknown }) => ({
      label: text(m?.label, "Casual", 24),
      percent: Math.max(0, Math.min(100, Math.round(Number(m?.percent) || 0))),
    }))
    .sort((a, b) => b.percent - a.percent);

  return {
    source: "ai",
    dripScore,
    styleLabel: text(data["styleLabel"], "Everyday Fit", 40),
    summary: text(data["summary"], "Solid fit with room to level up.", 320),
    occasion: text(data["occasion"], "Everyday", 40),
    visibleItems: dropUnseenItems(list(data["visibleItems"], 6, 40), seen),
    notVisible: notVisible.slice(0, 6),
    breakdown,
    working: dropUnseenItems(list(data["working"], 3, 90), seen),
    levelUp,
    palette: palette.length ? palette : [{ name: "Neutral", hex: "#8a8a8a" }],
    combos: list(data["combos"], 3, 40),
    styleMatch,
  };
}
