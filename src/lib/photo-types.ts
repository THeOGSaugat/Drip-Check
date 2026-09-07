/** Types for the /check photo analysis flow. UI never imports server code. */

export type PhotoCategoryKey =
  | "style"
  | "colors"
  | "coordination"
  | "shoes"
  | "accessories";

export type PhotoCategory = {
  visible: boolean;
  score: number | null;
};

export type PhotoBreakdown = Record<PhotoCategoryKey, PhotoCategory>;

export type PaletteColor = {
  name: string;
  hex: string;
};

export type LevelUpTip = {
  title: string;
  text: string;
};

export type StyleMatch = {
  label: string;
  percent: number;
};

export type PhotoAnalysis = {
  /** "ai" when a real vision model produced this, "demo" for the offline fallback. */
  source: "ai" | "demo";
  dripScore: number;
  styleLabel: string;
  summary: string;
  occasion: string;
  visibleItems: string[];
  notVisible: string[];
  breakdown: PhotoBreakdown;
  working: string[];
  levelUp: LevelUpTip[];
  palette: PaletteColor[];
  combos: string[];
  styleMatch: StyleMatch[];
};

export const PHOTO_BREAKDOWN_LABELS: Array<{ key: PhotoCategoryKey; label: string }> = [
  { key: "style", label: "Style" },
  { key: "colors", label: "Colors" },
  { key: "coordination", label: "Coordination" },
  { key: "shoes", label: "Shoes" },
  { key: "accessories", label: "Accessories" },
];

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
