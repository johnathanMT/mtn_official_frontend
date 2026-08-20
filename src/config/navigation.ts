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
    blurb: "The person behind the chapters — engineering, image, and the long road between them.",
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
