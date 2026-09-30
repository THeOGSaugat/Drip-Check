/**
 * Visibility rules shared by every outfit check — Live Check, Rating Game and
 * Photo Check. Pure functions with no I/O, so every path applies exactly the
 * same rules and they can be tested in isolation.
 *
 * The rules:
 * - A category the model could not see is "Not Visible": its score is null,
 *   never 0, and it is left out of the overall score entirely.
 * - The overall Drip Score is the mean of the visible categories only, computed
 *   here rather than trusted from the model, so an unseen category can never
 *   drag it down.
 * - Anything the model lists or advises about a category it marked as not
 *   visible is a contradiction — i.e. invented — and is dropped.
 */

import type { Coverage } from "./live-types";

export type ScoredCategory = { visible: boolean; score: number | null };

/** Rounds to one decimal inside the 1.0–10.0 range; null when not a usable number. */
export function clampScore(n: unknown): number | null {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(Math.min(10, Math.max(1, v)) * 10) / 10;
}

/**
 * Normalises one model category. Anything other than an explicit `visible: true`
 * with a usable score is Not Visible — a "visible" category with no real score
 * is treated as unseen rather than given an invented number.
 */
export function normalizeCategory(raw: unknown): ScoredCategory {
  const c = (raw ?? {}) as { visible?: unknown; score?: unknown };
  if (c.visible !== true) return { visible: false, score: null };
  const score = clampScore(c.score);
  return score === null ? { visible: false, score: null } : { visible: true, score };
}

/** Mean of the visible categories, one decimal. null when nothing is visible. */
export function visibleAverage(categories: ScoredCategory[]): number | null {
  const scores = categories
    .filter((c) => c.visible && c.score !== null)
    .map((c) => c.score as number);
  if (scores.length === 0) return null;
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(mean * 10) / 10;
}

/** Which categories were actually seen. `bottom` is absent for Photo Check. */
export type SeenCategories = { shoes: boolean; accessories: boolean; bottom?: boolean };

const FOOTWEAR =
  /\b(shoes?|sneakers?|trainers?|boots?|loafers?|heels?|sandals?|footwear|oxfords?|mules?|slippers?|kicks)\b/i;
const BOTTOMS =
  /\b(pants|trousers|jeans|shorts|skirts?|chinos|joggers|leggings|slacks|sweatpants|cargos)\b/i;
const ACCESSORIES =
  /\b(watch(es)?|chains?|necklaces?|bracelets?|rings?|earrings?|caps?(?![-\w])|hats?|beanies?|bags?|belts?|sunglasses|glasses|scarf|scarves|totes?)\b/i;

function mentionsUnseen(text: string, seen: SeenCategories, includeAccessories: boolean) {
  if (!seen.shoes && FOOTWEAR.test(text)) return true;
  if (seen.bottom === false && BOTTOMS.test(text)) return true;
  if (includeAccessories && !seen.accessories && ACCESSORIES.test(text)) return true;
  return false;
}

/**
 * Drops item names / praise that name a category the model marked Not Visible
 * (e.g. "White sneakers" when shoes were not visible) — the item was invented.
 */
export function dropUnseenItems(items: string[], seen: SeenCategories): string[] {
  return items.filter((item) => !mentionsUnseen(item, seen, true));
}

/**
 * Drops advice about a category that was never seen ("Swap the sneakers for
 * loafers" when no shoes were in frame). Advice to ADD an accessory to the
 * visible outfit is legitimate, so accessories are not filtered here.
 */
export function dropUnseenAdvice<T extends { text: string; title?: string }>(
  tips: T[],
  seen: SeenCategories,
): T[] {
  return tips.filter((tip) => !mentionsUnseen(`${tip.title ?? ""} ${tip.text}`, seen, false));
}

/** How much of the outfit was captured, derived from what was actually scored. */
export function deriveCoverage(seen: {
  top: boolean;
  layering: boolean;
  bottom: boolean;
  shoes: boolean;
  anything: boolean;
}): Coverage {
  const upper = seen.top || seen.layering;
  if (upper && seen.bottom && seen.shoes) return "full";
  if (upper) return "upper";
  if (seen.bottom || seen.shoes) return "lower";
  return seen.anything ? "upper" : "none";
}
