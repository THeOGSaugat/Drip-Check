/**
 * Server-only style-compatibility service for the Discover "Compare with my
 * style" feature.
 *
 * IMPORTANT: this intentionally does NOT do virtual try-on / image
 * generation. It reuses the same free text+vision Gemini Flash model as
 * /check and /live (see fit-analysis.server.ts / MODEL) to compare two
 * outfit PHOTOS and return a text verdict. Image-generation models
 * (Nano Banana etc.) have no free API tier, so this feature is designed to
 * never call one.
 */

import { AnalysisError, callGateway, MODEL } from "./fit-analysis.server";
import type { CompareVerdict } from "./compare-types";

const SYSTEM_PROMPT = `You are DripCheck's style-match assistant.

You are given two outfit photos:
- PHOTO A: an outfit the user has already worn/uploaded (their own established style).
- PHOTO B: a trending fit from the Discover feed they are curious about.

You ONLY evaluate clothing and styling. You must NEVER assess, mention, infer or score:
face, attractiveness, body shape, weight, height, age, race, skin tone, gender or any
physical attribute of the person in either photo. Judge garments, colours, layering,
footwear, accessories and overall styling only — never the person wearing them.

Your job is NOT to guess how the person would look wearing outfit B. You are comparing
the STYLE FAMILY, COLOUR PALETTE and SILHOUETTE of outfit B against outfit A, and
reporting how compatible they are — like a stylist comparing two looks in a lookbook.

matchPercent: 0-100, how compatible outfit B's style/palette/silhouette is with outfit A.
headline: one short, punchy sentence summarizing the read.
working: 2-3 concrete reasons outfit B would suit their established style (from photo A).
watchOuts: 1-3 concrete styling adjustments to bridge any gap between the two looks.
suggestedTweak: one concrete, wearable suggestion for adapting outfit B toward their vibe.

If PHOTO A has no visible clothing (e.g. it's not an outfit photo), set matchPercent to 0
and say so plainly in the headline, with empty working/watchOuts and a suggestedTweak
asking them to upload a clearer fit photo.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matchPercent", "headline", "working", "watchOuts", "suggestedTweak"],
  properties: {
    matchPercent: { type: "number" },
    headline: { type: "string" },
    working: { type: "array", minItems: 0, maxItems: 3, items: { type: "string" } },
    watchOuts: { type: "array", minItems: 0, maxItems: 3, items: { type: "string" } },
    suggestedTweak: { type: "string" },
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
    throw new AnalysisError("The comparison returned an unreadable response.", 502);
  }
}

const text = (v: unknown, fallback: string, max: number) =>
  String(v ?? fallback).slice(0, max) || fallback;

const list = (v: unknown, max: number, len = 100) =>
  (Array.isArray(v) ? v : [])
    .map((s) => String(s).slice(0, len).trim())
    .filter(Boolean)
    .slice(0, max);

export async function compareOutfitStyles(
  myImageDataUrl: string,
  targetImageDataUrl: string,
): Promise<CompareVerdict> {
  const content = await callGateway({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "PHOTO A is my own fit. PHOTO B is the Discover fit I'm curious about. Compare their style, palette and silhouette and return the comparison JSON.",
          },
          { type: "image_url", image_url: { url: myImageDataUrl } },
          { type: "image_url", image_url: { url: targetImageDataUrl } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "style_compare", strict: true, schema: SCHEMA },
    },
  });

  const data = parseJson(content);
  const matchPercent = Math.max(0, Math.min(100, Math.round(Number(data["matchPercent"]) || 0)));

  return {
    source: "ai",
    matchPercent,
    headline: text(data["headline"], "Solid style overlap.", 140),
    working: list(data["working"], 3),
    watchOuts: list(data["watchOuts"], 3),
    suggestedTweak: text(data["suggestedTweak"], "", 220),
  };
}
