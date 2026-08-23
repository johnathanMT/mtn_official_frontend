/**
 * ============================================================================
 *  NAVIGATION CONFIG  —  src/config/navigation.ts
 * ============================================================================
 *
 *  Single source of truth for the site's routes, in the same spirit as the
 *  Media Control Room. Nav components never hardcode a label or an href.
 *
 *  Adding a chapter is a three-step job:
 *    1. add an entry here
 *    2. create src/app/(chapters)/<slug>/page.tsx
 *    3. add a cover image under MEDIA.chapters in mediaControl.ts
 * ============================================================================
 */

export type ChapterId = "about" | "adventure" | "art" | "tech" | "fortune";

export interface NavLink {
  label: string;
  href: string;
  /** Key into MEDIA.chapters — ties a route to its cover image. */
  chapter: ChapterId;
  /** One line, used on the route's own page header and in its metadata. */
  blurb: string;
}

export const BRAND = {
  name: "Myo Thant Naing",
  /** Shortened lockup used below the `sm` breakpoint. */
  short: "MTN",
  href: "/",
} as const;

export const NAV_LINKS: NavLink[] = [
  {
    label: "About me",
    href: "/about",
    chapter: "about",
    blurb:
      "The person behind the chapters — engineering, image, and the long road between them.",
  },
  {
    label: "Adventure",
    href: "/adventure",
    chapter: "adventure",
    blurb: "Expeditions, altitude and the road between places.",
  },
  {
    label: "Art",
    href: "/art",
    chapter: "art",
    blurb: "Photography, composition and the things worth framing.",
  },
  {
    label: "Tech",
    href: "/tech",
    chapter: "tech",
    blurb: "Systems, software and the craft of building them.",
  },
  {
    label: "Fortune",
    href: "/fortune",
    chapter: "fortune",
    blurb: "Astrology, timing and reading what the sky is doing.",
  },
];

export const NAV_CTA = {
  label: "Contact",
  href: "/contact",
} as const;

/* ---------------------------------------------------------------------------
 * IDENTITY — read by PremiumFooter, and by anything else that needs to reach
 * you. Same principle as the routes above: one place, not scattered strings.
 *
 * CONFIRM THE TWO PROFILE URLS. I do not know your handles, so the slugs
 * below are placeholders shaped like the real thing. Correct them here and
 * every link on the site follows.
 * ------------------------------------------------------------------------ */

export const CONTACT_EMAIL = "hello@myothantnaing.com";

/** The engineering site — a separate origin, opened in a new tab. */
export const DEVELOPER_PORTAL = {
  label: "Enter Developer Portal",
  href: "https://myothant.dev",
} as const;

/** Travel-diary stills open the Instagram profile. */
export const INSTAGRAM = {
  label: "Follow me on Instagram",
  href: "https://www.instagram.com/johnathan_mt9?igsh=MWtkaG9oenBucHJiYQ%3D%3D&utm_source=qr",
} as const;

export interface SocialLink {
  label: string;
  href: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/myothantnaing" },
  { label: "GitHub", href: "https://github.com/myothantnaing" },
];

/** Pixels scrolled before the bar switches from transparent to glass. */
export const NAV_GLASS_THRESHOLD = 32;

/**
 * Routes that open with a full-bleed dark image directly under the navbar.
 * On these, the bar starts fully transparent with ivory text; everywhere else
 * it starts already glassed, so ivory text never lands on an ivory page.
 *
 * Every chapter route qualifies because each one opens with its cover image.
 */
export const ROUTES_WITH_DARK_HERO: readonly string[] = [
  "/",
  ...NAV_LINKS.map((l) => l.href),
];

export function hasDarkHero(pathname: string): boolean {
  return ROUTES_WITH_DARK_HERO.includes(pathname);
}

/** Look up a chapter's config by route — used by each page.tsx. */
export function getChapter(href: string): NavLink | undefined {
  return NAV_LINKS.find((l) => l.href === href);
}

/* ---------------------------------------------------------------------------
 * CHAPTER NUMBERS
 *
 * THESE EXIST BECAUSE THE NUMBERS HAD ALREADY DRIFTED, AND NOT ONLY ON
 * FORTUNE. The mobile nav derives its numbering from this array's ORDER, but
 * every hero typed its own number as a literal in a different file, and all
 * five were wrong:
 *
 *     route        nav (by order)   hero said       hero says now
 *     /about             01         "The person"    Chapter 01
 *     /adventure         02         Chapter 01      Chapter 02
 *     /art               03         Chapter 02      Chapter 03
 *     /tech              04         Chapter 03      Chapter 04
 *     /fortune           05         Chapter 04      Chapter 05
 *
 * About was never numbered at all, so the other four were each running exactly
 * one behind the nav. Renumbering five strings would have fixed today and
 * guaranteed tomorrow: insert a sixth chapter anywhere but the end and they
 * drift again. The number is now DERIVED from this array in both places, so
 * reordering NAV_LINKS renumbers the nav and every hero together.
 * ------------------------------------------------------------------------ */

/** Myanmar digits, U+1040 to U+1049, indexed by their Latin value. */
const MYANMAR_DIGITS = "၀၁၂၃၄၅၆၇၈၉";

/**
 * "05" -> "၀၅". Character by character, so it is safe on any numeric string
 * and leaves everything that is not a digit alone.
 */
export function toMyanmarDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => MYANMAR_DIGITS[Number(d)]);
}

/**
 * A chapter's position in NAV_LINKS, zero-padded, in both scripts.
 *
 * padStart rather than the `0${i + 1}` template the navbar used to carry —
 * that one prints "010" at ten chapters. Unlikely, but the entire point of
 * this block is that nobody has to remember.
 *
 * An unknown href yields "00" rather than throwing: a hero with a typo in its
 * route should render something obviously wrong, not take the page down.
 */
export function getChapterNumber(href: string): { en: string; my: string } {
  const index = NAV_LINKS.findIndex((l) => l.href === href);
  const en = String(index + 1).padStart(2, "0");
  return { en, my: toMyanmarDigits(en) };
}

/** The whole eyebrow, e.g. { en: "Chapter 05", my: "အခန်း ၀၅" }. */
export function chapterEyebrow(href: string): { en: string; my: string } {
  const n = getChapterNumber(href);
  return { en: `Chapter ${n.en}`, my: `အခန်း ${n.my}` };
}
