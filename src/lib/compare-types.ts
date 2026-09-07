/**
 * Types for the "Compare with my style" feature on /discover.
 * This is a FREE, text-only comparison — it never generates or edits images.
 * It reads two outfit photos (the user's own fit + a Discover fit) and
 * returns a style-compatibility read, using the same free vision model as
 * /check and /live.
 */

export type CompareVerdict = {
  /** "ai" when a real vision model produced this, "demo" for the offline fallback. */
  source: "ai" | "demo";
  /** 0-100. How compatible the target fit's style/palette is with the user's own fit. */
  matchPercent: number;
  /** One short, punchy sentence summarizing the read. */
  headline: string;
  /** 2-3 concrete reasons this fit would suit their established style. */
  working: string[];
  /** 1-3 concrete adjustments to bridge any gap. */
  watchOuts: string[];
  /** One concrete, wearable suggestion for adapting the fit to their vibe. */
  suggestedTweak: string;
};
