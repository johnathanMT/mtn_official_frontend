/**
 * ============================================================================
 *  BURMESE PROVERBS  —  src/config/proverbs.ts
 * ============================================================================
 *
 *  Content lives in config here, the same way routes live in navigation.ts and
 *  media lives in mediaControl.ts. Editing a proverb, its weight or its colour
 *  should never mean opening a component.
 *
 *  `weight` drives type size only — it is a design dial, not a claim about how
 *  important a proverb is. Range 10–60; the component maps it onto a pixel
 *  size that depends on how wide the container actually is.
 * ============================================================================
 */

export interface Proverb {
  /** The proverb, in Burmese. */
  text: string;
  /** 10 (small) → 60 (largest). Relative only. */
  weight: number;
}

export const PROVERBS: readonly Proverb[] = [
  { text: "ဖြစ်ချင်တာဖြစ် မောင်ဘချစ်", weight: 52 },
  { text: "ငုပ်မိသဲတိုင် တတ်နိုင်ဖျားရောက်", weight: 22 },
  { text: "ကိုယ့်လှေကိုယ်ထိုး ပဲခူးရောက်ရောက်", weight: 60 },
  { text: "ကြားရဲရာ ကြမ္မာမယိုးသာ", weight: 26 },
  { text: "ကျောပူမှဝမ်းအေး", weight: 44 },
  { text: "သစ်တစ်ပင်ကောင်း ငှက်တစ်သောင်းနားနိုင်", weight: 48 },
  { text: "ငရဲရောက်မှ ကျောင်းဆောက်ချင်", weight: 34 },
  { text: "ငရဲကလာသူ ပြာပူမကြောက်", weight: 20 },
  { text: "နဂိုရီိမှ နဂိုင်းထွက်", weight: 16 },
  { text: "နေပူတုန်းစပါးလှမ်း", weight: 40 },
  { text: "လသာတုန်းဗိုင်းငင်", weight: 38 },
  { text: "မခေါ်လျှင် အထူးရသက်သာ", weight: 18 },
  { text: "မမြင်ဖူး မူးမြစ်ထင်", weight: 30 },
  { text: "မရွယ်ပဲ စော်ကဲမင်းဖြစ်", weight: 14 },
  { text: "ရေစီးတခါ ရေသာတစ်လှည့်", weight: 46 },
  { text: "ရော့ပတ္တမြား၊ ရော့နဂါး", weight: 24 },
  { text: "ရှင်နည်းရာ အဂ္ဂလူထွက်", weight: 12 },
  { text: "ဝါးလုံးခေါင်းထဲ လသာ", weight: 36 },
  { text: "ဝက်ဖြစ်တော့မှ မစင်မကြောက်", weight: 28 },
  { text: "အရင်းမစိုက် လှေထိုးလိုက်", weight: 32 },
  { text: "အရိပ်မလာခင် နေပူကစောင့်", weight: 42 },
  { text: "အလျင်လို လမ်းအိုလိုက်", weight: 15 },
  { text: "အဝေးတယ်ရှဥ်း၊ အနီးတစ်ရှဥ်း", weight: 19 },
  { text: "ဥစ္စာရင်လို ဥစ္စာရင်ခဲ", weight: 25 },
];

/* ---------------------------------------------------------------------------
 * TYPEFACE
 *
 * This exact string is used TWICE — once by d3-cloud to measure each phrase on
 * an off-screen canvas, and once by the <text> elements that finally paint. If
 * the two ever disagree the layout is computed for a font that is not the one
 * on screen, and the words overlap. Hence one constant, no duplication.
 *
 * Order matters: Myanmar Text ships with Windows, Myanmar MN and Myanmar Sangam
 * MN with macOS/iOS, Padauk and Pyidaungsu are the common Linux/Myanmar-locale
 * installs, and Noto Sans Myanmar is the Android/Chrome OS fallback.
 * ------------------------------------------------------------------------ */

export const BURMESE_FONT =
  '"Myanmar Text", "Myanmar MN", "Myanmar Sangam MN", Padauk, Pyidaungsu, "Noto Sans Myanmar", sans-serif';

/** Measured at, and painted at, the same weight — same reason as above. */
export const BURMESE_FONT_WEIGHT = 500;

/* ---------------------------------------------------------------------------
 * INK
 *
 * The cloud sits on mossy stone (#2A3222 → #3F4A32). Warm ivory, not white:
 * full white on that green is a fluorescent cut. Opacity is the depth cue —
 * heavier proverbs sit forward, lighter ones recede — and two or three of
 * the largest take a muted gold so they read as the precious lines.
 * ------------------------------------------------------------------------ */

export const CLOUD_INK = {
  gold: "#C5A059",
  ivory: "#EAE6D7",
  recede: "rgba(234, 230, 215, 0.6)",
  far: "rgba(234, 230, 215, 0.3)",
} as const;

const BY_WEIGHT = [...PROVERBS].sort((a, b) => b.weight - a.weight);

/** Colour a proverb by its rank in the weight list — not by layout order. */
export function cloudInkFor(text: string): string {
  const rank = BY_WEIGHT.findIndex((p) => p.text === text);
  if (rank < 0) return CLOUD_INK.recede;
  if (rank < 3) return CLOUD_INK.gold;
  if (rank < 10) return CLOUD_INK.ivory;
  if (rank < 19) return CLOUD_INK.recede;
  return CLOUD_INK.far;
}
