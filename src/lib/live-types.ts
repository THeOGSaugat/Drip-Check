export type CategoryKey =
  | "style"
  | "colorCoordination"
  | "top"
  | "bottom"
  | "layering"
  | "shoes"
  | "accessories"
  | "overall";

/** A single scored category. When `visible` is false the score is meaningless
 *  and the UI must render "Not visible" instead of a number. */
export type CategoryScore = {
  visible: boolean;
  score: number | null;
};

export type FitBreakdown = Record<CategoryKey, CategoryScore>;

export type FitSuggestion = {
  icon: string;
  title: string;
  text: string;
};

/** How much of the outfit the camera actually captured. */
export type Coverage = "full" | "upper" | "lower" | "none";

export type FitAnalysis = {
  dripScore: number;
  styleLabel: string;
  verdict: string;
  occasion: string;
  coverage: Coverage;
  /** True when only part of the outfit was visible — result is a PARTIAL FIT CHECK. */
  partial: boolean;
  visibleItems: string[];
  notVisible: string[];
  breakdown: FitBreakdown;
  suggestions: FitSuggestion[];
};

/** Pre-check result used to guide framing before the real analysis runs. */
export type FramingCheck = {
  personVisible: boolean;
  head: boolean;
  torso: boolean;
  lowerBody: boolean;
  feet: boolean;
  coverage: Coverage;
  readyForFullCheck: boolean;
  message: string;
};

export const BREAKDOWN_LABELS: Array<{ key: CategoryKey; label: string }> = [
  { key: "style", label: "Style" },
  { key: "colorCoordination", label: "Colors" },
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
  { key: "layering", label: "Layering" },
  { key: "shoes", label: "Shoes" },
  { key: "accessories", label: "Accessories" },
  { key: "overall", label: "Overall" },
];

export const COVERAGE_LABEL: Record<Coverage, string> = {
  full: "Full Fit Check",
  upper: "Partial Fit Check — Upper Body",
  lower: "Partial Fit Check — Lower Body",
  none: "No Fit Detected",
};
