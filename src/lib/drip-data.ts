import fitOldMoney01 from "@/assets/discover/fit-oldmoney-01.jpg";
import fitOldMoney02 from "@/assets/discover/fit-oldmoney-02.jpg";
import fitOldMoney03 from "@/assets/discover/fit-oldmoney-03.jpg";
import fitOldMoney04 from "@/assets/discover/fit-oldmoney-04.jpg";
import fitOldMoney05 from "@/assets/discover/fit-oldmoney-05.jpg";
import fitOldMoney06 from "@/assets/discover/fit-oldmoney-06.jpg";
import fitOldMoney07 from "@/assets/discover/fit-oldmoney-07.jpg";
import fitOldMoney08 from "@/assets/discover/fit-oldmoney-08.jpg";
import fitOldMoney09 from "@/assets/discover/fit-oldmoney-09.jpg";
import fitOldMoney10 from "@/assets/discover/fit-oldmoney-10.jpg";
import fitOldMoney11 from "@/assets/discover/fit-oldmoney-11.jpg";
import fitOldMoney12 from "@/assets/discover/fit-oldmoney-12.jpg";
import fitCasual01 from "@/assets/discover/fit-casual-01.jpg";
import fitCasual02 from "@/assets/discover/fit-casual-02.jpg";
import fitCasual03 from "@/assets/discover/fit-casual-03.jpg";
import fitCasual04 from "@/assets/discover/fit-casual-04.jpg";
import fitStreetwear01 from "@/assets/discover/fit-streetwear-01.jpg";
import fitStreetwear02 from "@/assets/discover/fit-streetwear-02.jpg";
import fitStreetwear03 from "@/assets/discover/fit-streetwear-03.jpg";
import fitStreetwear04 from "@/assets/discover/fit-streetwear-04.jpg";
import fitStreetwear05 from "@/assets/discover/fit-streetwear-05.jpg";
import fitStreetwear06 from "@/assets/discover/fit-streetwear-06.jpg";
import fitFormal01 from "@/assets/discover/fit-formal-01.jpg";
import fitFormal02 from "@/assets/discover/fit-formal-02.jpg";
import fitFormal03 from "@/assets/discover/fit-formal-03.jpg";
import fitVintage01 from "@/assets/discover/fit-vintage-01.jpg";
import fitVintage02 from "@/assets/discover/fit-vintage-02.jpg";
import fitVintage03 from "@/assets/discover/fit-vintage-03.jpg";
import fitVintage04 from "@/assets/discover/fit-vintage-04.jpg";
import fitVintage05 from "@/assets/discover/fit-vintage-05.jpg";
import fitVintage06 from "@/assets/discover/fit-vintage-06.jpg";
import fitVintage07 from "@/assets/discover/fit-vintage-07.jpg";
import fitVintage08 from "@/assets/discover/fit-vintage-08.jpg";

/**
 * Domain types for DripCheck.
 * These mirror the future database schema so the UI can switch from demo data
 * to real rows (fits, scores, profiles, leaderboard) without refactoring.
 */

export type ScoreBreakdown = {
  style: number;
  colors: number;
  coordination: number;
  accessories?: number;
};

export type Gender = "men" | "women";

export type Fit = {
  id: string;
  username: string;
  imageUrl: string;
  dripScore: number;
  breakdown: ScoreBreakdown;
  tags: string[];
  gender: Gender;
  createdAt: string;
};

export type StyleCategory = {
  slug: string;
  label: string;
  emoji?: string;
};

export const STYLE_CATEGORIES: StyleCategory[] = [
  { slug: "streetwear", label: "Streetwear" },
  { slug: "old-money", label: "Old Money" },
  { slug: "vintage", label: "Vintage" },
  { slug: "casual", label: "Casual" },
  { slug: "formal", label: "Formal" },
];

export type GenderFilter = {
  slug: Gender;
  label: string;
};

export const GENDER_FILTERS: GenderFilter[] = [
  { slug: "men", label: "Men" },
  { slug: "women", label: "Women" },
];

export const HERO_FIT: Fit = {
  id: "hero",
  username: "comolook",
  imageUrl: fitOldMoney01,
  dripScore: 9.6,
  breakdown: { style: 9.7, colors: 9.4, coordination: 9.6 },
  tags: ["old-money", "lakeside", "polo"],
  gender: "men",
  createdAt: new Date().toISOString(),
};

export const DEMO_FITS: Fit[] = [
  // Old Money — Men
  {
    id: "f-om-01",
    username: "comolook",
    imageUrl: fitOldMoney01,
    dripScore: 9.6,
    breakdown: { style: 9.7, colors: 9.4, coordination: 9.6 },
    tags: ["old-money", "lakeside", "polo"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-02",
    username: "marinastripe",
    imageUrl: fitOldMoney02,
    dripScore: 9.2,
    breakdown: { style: 9.3, colors: 9.0, coordination: 9.2, accessories: 9.1 },
    tags: ["old-money", "striped-shirt", "watch"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-03",
    username: "campusrugby",
    imageUrl: fitOldMoney03,
    dripScore: 9.4,
    breakdown: { style: 9.5, colors: 9.2, coordination: 9.4 },
    tags: ["old-money", "layered", "preppy"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-04",
    username: "oxfordmorning",
    imageUrl: fitOldMoney04,
    dripScore: 9.0,
    breakdown: { style: 9.1, colors: 8.9, coordination: 9.0, accessories: 8.8 },
    tags: ["old-money", "oxford", "cream-trousers"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-05",
    username: "portosunday",
    imageUrl: fitOldMoney05,
    dripScore: 9.5,
    breakdown: { style: 9.6, colors: 9.3, coordination: 9.5, accessories: 9.4 },
    tags: ["old-money", "tied-sweater", "cap"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-06",
    username: "linenandgold",
    imageUrl: fitOldMoney06,
    dripScore: 9.1,
    breakdown: { style: 9.3, colors: 8.9, coordination: 9.1 },
    tags: ["old-money", "linen", "resort"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-07",
    username: "preplayered",
    imageUrl: fitOldMoney07,
    dripScore: 9.0,
    breakdown: { style: 9.2, colors: 8.8, coordination: 9.0, accessories: 8.9 },
    tags: ["old-money", "quarter-zip", "tie"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  // Old Money — Women
  {
    id: "f-om-08",
    username: "consoletable",
    imageUrl: fitOldMoney08,
    dripScore: 9.3,
    breakdown: { style: 9.4, colors: 9.1, coordination: 9.3, accessories: 9.2 },
    tags: ["old-money", "waistcoat", "wide-leg"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-09",
    username: "benchandblazer",
    imageUrl: fitOldMoney09,
    dripScore: 9.4,
    breakdown: { style: 9.5, colors: 9.2, coordination: 9.4 },
    tags: ["old-money", "double-breasted", "turtleneck"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-10",
    username: "olivepatio",
    imageUrl: fitOldMoney10,
    dripScore: 9.1,
    breakdown: { style: 9.2, colors: 8.9, coordination: 9.1, accessories: 9.0 },
    tags: ["old-money", "striped-tee", "ballet-flats"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-11",
    username: "fittingroomstripe",
    imageUrl: fitOldMoney11,
    dripScore: 9.0,
    breakdown: { style: 9.1, colors: 8.8, coordination: 9.0 },
    tags: ["old-money", "striped-shirt", "wide-leg"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-om-12",
    username: "greytailoring",
    imageUrl: fitOldMoney12,
    dripScore: 9.2,
    breakdown: { style: 9.3, colors: 9.0, coordination: 9.2, accessories: 9.0 },
    tags: ["old-money", "pleated-trousers", "minimal"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  // Formal — Men
  {
    id: "f-fm-01",
    username: "boardroomready",
    imageUrl: fitFormal01,
    dripScore: 8.8,
    breakdown: { style: 8.9, colors: 8.7, coordination: 8.8, accessories: 8.9 },
    tags: ["formal", "shirt-and-tie", "office"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  // Formal — Women
  {
    id: "f-fm-02",
    username: "elevatorfit",
    imageUrl: fitFormal02,
    dripScore: 8.9,
    breakdown: { style: 9.0, colors: 8.7, coordination: 8.9 },
    tags: ["formal", "office", "wide-leg"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-fm-03",
    username: "espressobreak",
    imageUrl: fitFormal03,
    dripScore: 9.0,
    breakdown: { style: 9.1, colors: 8.8, coordination: 9.0, accessories: 8.9 },
    tags: ["formal", "office", "heels"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  // Casual — Men
  {
    id: "f-cs-01",
    username: "offdutyblue",
    imageUrl: fitCasual01,
    dripScore: 8.7,
    breakdown: { style: 8.8, colors: 8.5, coordination: 8.7 },
    tags: ["casual", "striped-shirt", "wide-leg"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-cs-02",
    username: "viennastreet",
    imageUrl: fitCasual02,
    dripScore: 8.6,
    breakdown: { style: 8.6, colors: 8.4, coordination: 8.6 },
    tags: ["casual", "plain-tee", "denim"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-cs-03",
    username: "gardenwalk",
    imageUrl: fitCasual03,
    dripScore: 8.5,
    breakdown: { style: 8.6, colors: 8.3, coordination: 8.5 },
    tags: ["casual", "knitwear", "denim"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  // Casual — Women
  {
    id: "f-cs-04",
    username: "crosswalkmatcha",
    imageUrl: fitCasual04,
    dripScore: 8.8,
    breakdown: { style: 8.9, colors: 8.6, coordination: 8.8 },
    tags: ["casual", "linen-shirt", "denim"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  // Streetwear — Men
  {
    id: "f-sw-01",
    username: "tankwatchfit",
    imageUrl: fitStreetwear01,
    dripScore: 8.9,
    breakdown: { style: 9.0, colors: 8.7, coordination: 8.9, accessories: 9.1 },
    tags: ["streetwear", "wide-denim", "loafers"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-sw-02",
    username: "roadsidefit",
    imageUrl: fitStreetwear02,
    dripScore: 9.0,
    breakdown: { style: 9.1, colors: 8.9, coordination: 9.0 },
    tags: ["streetwear", "wide-denim", "minimal"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  // Streetwear — Women
  {
    id: "f-sw-03",
    username: "starpatchdenim",
    imageUrl: fitStreetwear03,
    dripScore: 9.0,
    breakdown: { style: 9.1, colors: 8.8, coordination: 9.0, accessories: 8.9 },
    tags: ["streetwear", "leather-jacket", "wide-denim"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-sw-04",
    username: "jerseyandbaggy",
    imageUrl: fitStreetwear04,
    dripScore: 8.8,
    breakdown: { style: 8.9, colors: 8.6, coordination: 8.8 },
    tags: ["streetwear", "jersey", "wide-denim"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-sw-05",
    username: "patentmoto",
    imageUrl: fitStreetwear05,
    dripScore: 8.9,
    breakdown: { style: 9.0, colors: 8.7, coordination: 8.9 },
    tags: ["streetwear", "leather-jacket", "wide-denim"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-sw-06",
    username: "redcapmoto",
    imageUrl: fitStreetwear06,
    dripScore: 8.9,
    breakdown: { style: 9.0, colors: 8.7, coordination: 8.9, accessories: 9.0 },
    tags: ["streetwear", "leather-jacket", "denim"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  // Vintage — Men
  {
    id: "f-vt-01",
    username: "raindropleather",
    imageUrl: fitVintage01,
    dripScore: 9.2,
    breakdown: { style: 9.4, colors: 8.9, coordination: 9.2 },
    tags: ["vintage", "leather-jacket", "boots"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-vt-02",
    username: "benchflare",
    imageUrl: fitVintage02,
    dripScore: 8.9,
    breakdown: { style: 9.0, colors: 8.7, coordination: 8.9, accessories: 8.8 },
    tags: ["vintage", "flared-denim", "leather"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-vt-03",
    username: "vintagevoltage",
    imageUrl: fitVintage03,
    dripScore: 8.7,
    breakdown: { style: 8.8, colors: 8.5, coordination: 8.7 },
    tags: ["vintage", "band-tee", "flared-denim"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-vt-04",
    username: "duskleather",
    imageUrl: fitVintage04,
    dripScore: 9.1,
    breakdown: { style: 9.2, colors: 8.9, coordination: 9.1 },
    tags: ["vintage", "leather-jacket", "flared-denim"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-vt-05",
    username: "retrorider",
    imageUrl: fitVintage05,
    dripScore: 9.3,
    breakdown: { style: 9.4, colors: 9.1, coordination: 9.3, accessories: 9.2 },
    tags: ["vintage", "leather-jacket", "newsboy-cap"],
    gender: "men",
    createdAt: new Date().toISOString(),
  },
  // Vintage — Women
  {
    id: "f-vt-06",
    username: "pergolabloom",
    imageUrl: fitVintage06,
    dripScore: 9.1,
    breakdown: { style: 9.2, colors: 9.0, coordination: 9.1 },
    tags: ["vintage", "floral-dress", "sundress"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-vt-07",
    username: "goldenhourfloral",
    imageUrl: fitVintage07,
    dripScore: 9.0,
    breakdown: { style: 9.1, colors: 8.9, coordination: 9.0 },
    tags: ["vintage", "floral-dress", "sundress"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
  {
    id: "f-vt-08",
    username: "toilebluemidi",
    imageUrl: fitVintage08,
    dripScore: 9.2,
    breakdown: { style: 9.3, colors: 9.1, coordination: 9.2, accessories: 9.0 },
    tags: ["vintage", "floral-dress", "cardigan"],
    gender: "women",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Data access layer. Today these resolve demo data; later they will query the
 * database (fits / drip_scores / profiles) with the same signatures.
 */
export async function fetchTrendingFits(): Promise<Fit[]> {
  return DEMO_FITS;
}

export const trendingFitsQuery = {
  queryKey: ["fits", "trending"] as const,
  queryFn: fetchTrendingFits,
};
