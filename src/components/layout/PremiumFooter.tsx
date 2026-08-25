"use client";

/**
 * ============================================================================
 *  PREMIUM FOOTER — deep crimson everywhere, a ghosted forest on /fortune
 * ============================================================================
 *
 *  One component, two backdrops. The crimson slab, the type, the grid and the
 *  spacing are identical on every route; the only thing the route decides is
 *  what sits behind the crimson — the original pair of crimson blooms, or the
 *  forest still ghosted into it.
 *
 *  ---------------------------------------------------------------------------
 *  WHAT ACTUALLY CAUSED THE "CUT IN HALF" LOOK
 *  ---------------------------------------------------------------------------
 *  Worth naming so it does not come back. The previous version stacked three
 *  scrims: a top-down fade, a flat tint, and a plate covering the bottom 38%.
 *  Measured down the footer, the coverage ran 0.96 at the top, opened to 0.73
 *  around 62% of the way down, then closed back to 0.95. That is a bright band
 *  with darkness above AND below it — which is exactly what a horizontal cut
 *  looks like. The image was never cropped; the scrim just lit one stripe of it
 *  and buried the rest. `object-bottom` made it worse by pinning the brightest
 *  part of the photo to the region the plate was darkening.
 *
 *  All three scrims are gone. Nothing grades, so nothing can band.
 *
 *  ---------------------------------------------------------------------------
 *  THE BLEND MODE: LUMINOSITY, NOT OVERLAY — AND THIS ONE IS NOT A PREFERENCE
 *  ---------------------------------------------------------------------------
 *  You offered `mix-blend-overlay` or `mix-blend-luminosity`. On this backdrop
 *  they are not two flavours of the same thing; one of them does nothing at all.
 *
 *  `overlay` is conditional on the BACKDROP: where the backdrop is lighter than
 *  50% it screens (lightens), where it is darker it multiplies (darkens). The
 *  crimson base here is #1a0408 — about 0.2% relative luminance, nowhere near
 *  the switch — so overlay resolves to multiply everywhere in this footer, and
 *  multiplying into near-black returns near-black.
 *
 *  Rather than argue that, I measured it: a pure-white stand-in image, opacity
 *  forced to 1, mean relative luminance of a type-free band of the slab.
 *
 *      slab alone ............. 0.00244      (grey 8 / 255)
 *      mix-blend-overlay ...... 0.00691      (grey 23)   +0.004
 *      mix-blend-soft-light ... 0.01537      (grey 34)   +0.013
 *      mix-blend-luminosity ... 1.00000      (white)     +0.998
 *      mix-blend-screen ....... 1.00000      (white)     +0.998
 *      mix-blend-normal ....... 1.00000      (white)     +0.998
 *
 *  That is the whole argument. With the brightest image that can exist and no
 *  opacity reduction at all, overlay moves the slab from grey 8 to grey 23 —
 *  and the shipped setting is a fifth of that, over a photograph that is mostly
 *  dark. It would be indistinguishable from no image at all.
 *
 *  `luminosity` takes the LIGHTNESS of the source and keeps the hue and chroma
 *  of the backdrop, so the forest arrives as a monochrome carrying whatever
 *  warmth the crimson has rather than dragging green into the palette. That is
 *  what is set below. `screen` is the other mode that genuinely works on a dark
 *  base; it reads brighter and cooler. `soft-light` is the one to try if 20%
 *  luminosity is still too present — it is subtler than luminosity but, unlike
 *  overlay, not zero.
 *
 *  ---------------------------------------------------------------------------
 *  `isolate` STAYS
 *  ---------------------------------------------------------------------------
 *  Different reason than last time. A blend mode composites against everything
 *  painted beneath it in the nearest stacking context — without `isolate` that
 *  reaches past the footer into the page behind it, so the ghost would change
 *  depending on which route rendered it. `isolate` walls the blend into this
 *  element.
 *
 *  The negative z-indices are gone too. The backdrop is a plain `absolute
 *  inset-0` layer painted after the footer's background and before the
 *  `relative z-10` content, which is the same order without the hazard — a
 *  `-z-` child needs a stacking context to stay inside its parent at all, and
 *  that is a trap waiting for whoever edits this next.
 *
 *  ---------------------------------------------------------------------------
 *  READABILITY
 *  ---------------------------------------------------------------------------
 *  The ghost is capped at 20% opacity, which is what makes the scrims
 *  unnecessary. Measured on the rendered page with a pure white stand-in image
 *  — the brightest photograph physically possible — across 17 lines of type at
 *  390px and 1440px:
 *
 *      dimmest line anywhere ... 6.36 : 1   (the Burmese under Back to Top,
 *                                            over a lifted slab of rgb(70,54,56))
 *      AA floor ................ 4.50 : 1
 *
 *  Every other line is higher. The base colour and the 20% cap carry it on
 *  their own, with no gradient anywhere — which is why the scrims could go and
 *  why nothing can band again.
 *
 *  ---------------------------------------------------------------------------
 *  TWO THINGS I KEPT THAT YOU MAY WANT TO CHANGE
 *  ---------------------------------------------------------------------------
 *  1. The bilingual labels stay on EVERY route, not just /fortune. You asked
 *     for them as a site-wide consistency pass and they are content rather than
 *     background styling, so the route check does not touch them. If you want
 *     them gated too, wrap each Burmese line in `{isFortunePage && ...}`.
 *  2. The copyright is ivory/85, where the original was /65. That was raised
 *     when the photograph went in. Measured against the worst case here, /85 is
 *     8.59:1 and /65 is 5.76:1 — both pass, so this one really is taste. Put it
 *     back to /65 if you prefer the lighter touch.
 *
 *  The chapter links are not typed out — they come from
 *  src/config/navigation.ts, the same source the navbar reads.
 *
 *  Rendered as a sibling of <main>, not a child — see the note in page.tsx.
 * ============================================================================
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";

import {
  BRAND,
  NAV_LINKS,
  SOCIAL_LINKS,
  CONTACT_EMAIL,
} from "@/config/navigation";
import {
  FooterMysticProvider,
  FooterMysticSlot,
  MysticFooterFrame,
} from "@/components/layout/FooterMystic3D";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------------------
 * ROUTE
 *
 * A literal rather than an import from navigation.ts, deliberately: NAV_LINKS
 * is the list of chapters, and reaching into it to ask "is this the fortune
 * one" would tie a visual treatment to the nav's data shape. If a second route
 * ever earns the backdrop, this becomes a Set and the check becomes .has().
 * ------------------------------------------------------------------------ */

const BACKDROP_ROUTES = ["/fortune"] as const;

/* ---------------------------------------------------------------------------
 * THE SLAB
 *
 * This is the ORIGINAL footer colour, restored verbatim: black with a whisper
 * of the palette's Deep Crimson rather than the full #5E0B15 field, which
 * overpowered the page when it was tried. It was never replaced by a neutral
 * black on purpose — the near-black that crept in was #0a0a0a, the Fortune
 * page's section colour, and it flattened the warmth out of the slab.
 *
 * If you want the crimson to read more strongly, this is the line: your
 * #3a0a14 lands roughly halfway between this and the full accent, and
 * `from-[#1a0408] to-[#3a0a14]` is a good pairing to try. Everything below
 * still measures safely at that value — the type is ivory and the slab would
 * still be under 6% luminance.
 * ------------------------------------------------------------------------ */

const SLAB = "bg-linear-to-b from-[#0a0000] to-[#1a0408]";

/* ---------------------------------------------------------------------------
 * THE GHOST — /fortune only
 * ------------------------------------------------------------------------ */

const GHOST = {
  /* Cloudinary public ID, not a URL — the loader (next.config.ts ->
     images.loaderFile) adds f_auto,q_auto,c_limit,w_<width>, which is what
     converts and sizes it. No `#…` suffix, so nothing is cropped server-side
     and object-center does the only framing there is. */
  src: "v1787476986/Minimal_Wild_Forest_Movie_Poster_jdq7i7.jpg",

  /* 20%, the top of the range you gave. At 15% over this slab the forest is
     essentially a texture — I could not tell it from film grain in a
     side-by-side. Drop it to opacity-15 if 20 still reads as too present. */
  opacity: "opacity-20",

  /* See the header. `mix-blend-overlay` resolves to multiply on a backdrop
     this dark and renders nothing at all. The alternatives that do work:
       mix-blend-luminosity  crimson-toned monochrome        (current)
       mix-blend-screen      brighter, cooler, less tinted
       mix-blend-soft-light  subtler than luminosity, warmer */
  blend: "mix-blend-luminosity",

  /* The ghost used to begin at full strength on the footer's very first row.
     On /fortune the SacredVerse banner above now dissolves INTO #0a0000, the
     slab's top colour — and then the photograph switched on at that exact
     boundary, which put a soft line back where the fade had just removed one.
     Measured at 1440px with a mid-grey stand-in photograph:

         last row of the banner   rgb(10,  0,  0)
         first row of the footer  rgb(33, 23, 23)

     Small in absolute terms, but at these luminances it is a 4-5x relative
     jump, and the eye reads relative. This eases the photograph in over the
     first 8rem so the two sections share one continuous surface.

     Explicit rgba rather than `to-transparent`, for the same reason as the
     banner's own fades: Tailwind's `transparent` is transparent BLACK, and
     ramping the crimson to it drags the midpoint toward black as well as
     toward see-through. */
  lead: "bg-[linear-gradient(to_bottom,rgba(10,0,0,1)_0%,rgba(10,0,0,0.65)_45%,rgba(10,0,0,0)_100%)]",
} as const;

/* ---------------------------------------------------------------------------
 * COPY
 * ------------------------------------------------------------------------ */

const SLOGAN = "Don't Be Institutionalized;";
const SLOGAN_SECOND = "Be the Architect of Your Environment.";

const BRAND_LINE = {
  en: "Exploring the intersections of technology, art, and destiny.",
  my: "နည်းပညာ၊ အနုပညာနှင့် ကံကြမ္မာတို့ ဆုံဆည်းရာ လမ်းဆုံများကို ရှာဖွေလေ့လာခြင်း။",
} as const;

const HEADINGS = {
  chapters: { en: "Chapters", my: "အခန်းများ" },
  connect: { en: "Connect", my: "ဆက်သွယ်ရန်" },
} as const;

const BACK_TO_TOP = { en: "Back to Top", my: "အပေါ်သို့ ပြန်တက်ရန်" } as const;

/* The year is a literal, not new Date().getFullYear(). A date read at render
   time differs between the server prerender and the client hydration for
   anyone whose clock is on the other side of midnight UTC, and React logs a
   hydration mismatch for it. A copyright year is a once-a-year edit. */
const COPYRIGHT_YEAR = 2026;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};

const ruleIn: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  show: { opacity: 1, scaleX: 1, transition: { duration: 1.1, ease: EASE } },
};

/* ---------------------------------------------------------------------------
 * SMALL PARTS
 * ------------------------------------------------------------------------ */

/**
 * A column heading in both languages.
 *
 * The English keeps its 0.24em tracking and uppercase; the Burmese takes
 * neither. Myanmar letter-spacing is inserted between a consonant and the
 * marks that belong to it, and `uppercase` has nothing to act on — the same
 * rules the Fortune page components follow, written out in full at the top of
 * FortuneHero.tsx.
 */
function ColumnHeading({ en, my }: { en: string; my: string }) {
  return (
    <h2>
      <span className="font-sans block text-[0.65rem] font-semibold tracking-[0.24em] text-[#FDFBF7]/85 uppercase">
        {en}
      </span>
      <span
        lang="my"
        className="font-myanmar mt-1.5 block text-[0.75rem] leading-[1.7] font-normal tracking-normal text-[#FDFBF7]/70"
      >
        {my}
      </span>
    </h2>
  );
}

/**
 * The hover treatment shared by every link in the grid: nudge right, lift
 * toward full ivory. `inline-block` is required — a transform has no effect
 * on an inline box, so without it `translate-x-2` silently does nothing.
 */
const LINK_CLASS =
  "inline-block text-[0.95rem] text-[#FDFBF7]/85 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-2 hover:text-[#FDFBF7] focus-visible:translate-x-2 focus-visible:text-[#FDFBF7] motion-reduce:transition-none motion-reduce:hover:translate-x-0";

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function PremiumFooter() {
  const reduceMotion = useReducedMotion() ?? false;

  /* usePathname returns the route this footer is rendered under. The footer
     lives in two layouts — app/page.tsx and (chapters)/layout.tsx — and both
     are inside the App Router, so this is "/fortune" on the fortune chapter
     and the real path everywhere else. It is null only during a static export
     of a route that does not exist, which is why the check is written to fail
     CLOSED: anything that is not exactly a backdrop route gets the original. */
  const pathname = usePathname();
  const isFortunePage = BACKDROP_ROUTES.includes(
    pathname as (typeof BACKDROP_ROUTES)[number],
  );

  /* globals.css sets `scroll-behavior: auto` under prefers-reduced-motion,
     but an explicit behavior:"smooth" here would override that CSS — so the
     preference has to be honoured in JS as well. */
  const backToTop = () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

  return (
    <FooterMysticProvider>
      <MysticFooterFrame
        /* isolate confines the ghost's blend mode to this element — see header.
           It costs nothing on the routes with no ghost. Overflow is hidden
           except while the mystic is in flight, so the figure can leave the
           slab and still snap back into the slot. */
        className={`${SLAB} text-[#FDFBF7]`}
      >
      {isFortunePage ? (
        <>
          {/* ================= THE GHOST =================
              One blended layer, no gradients. A plain absolutely-positioned
              child rather than a negative z-index: it paints after the
              footer's own background and before the z-10 content, which is
              the order we want, and it cannot escape the element the way a
              -z- child can. */}
          <div
            aria-hidden="true"
            /* -inset-px, NOT inset-0, and it is a bug fix rather than a nicety.
             The footer's top edge lands on a fractional device pixel whenever
             the content above it does not add up to whole pixels. A normal
             layer antialiases that edge harmlessly, but a mix-blend layer
             composited at PARTIAL coverage resolves BRIGHTER than its own
             steady state rather than dimmer — it drew a 1px warm hairline
             straight across the top of the footer. Measured at 1440px:

                 row above the seam    rgb(10,  0,  0)
                 the seam row          rgb(48, 38, 38)   <- the hairline
                 rows below            rgb(33, 23, 23)   <- the ghost, settled

             Deleting the <img> made the line vanish, which is what identified
             it. Overhanging the layer by a pixel puts the partial-coverage row
             outside the footer, where `overflow-hidden` clips it, so the first
             row you can actually see is fully covered. */
            className={`pointer-events-none absolute -inset-px ${GHOST.opacity} ${GHOST.blend}`}
          >
            <Image
              src={GHOST.src}
              /* Decorative. An empty alt is the correct way to say "skip this" —
               a description here would be announced before the contact
               details for no benefit. */
              alt=""
              fill
              /* Full-bleed, so 100vw is honest at every breakpoint. No
               `priority`: this is the last thing on the page and the early
               bandwidth belongs to the hero. */
              sizes="100vw"
              /* object-center, not object-bottom. Bottom-anchoring is what put
               the brightest part of the photograph under the old bottom
               plate. With no scrims to fight, centre is simply the least
               opinionated crop, and h-full w-full spell out what `fill`
               already sets so the intent survives a future edit. */
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>

          {/* The lead-in. Sits after the ghost in the DOM and before the z-10
              content, so it paints over the photograph and under the type.
              See GHOST.lead for the measurement that made it necessary. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 h-32 ${GHOST.lead}`}
          />
        </>
      ) : (
        /* ================= THE ORIGINAL BLOOMS ================= */
        /* Two soft crimson radials, exactly as the footer shipped before the
           backdrop existed. They give a flat slab some depth; on /fortune the
           photograph does that job and stacking both muddied the crimson. */
        <>
          <div
            aria-hidden="true"
            className="from-accent-900/50 via-accent-800/25 pointer-events-none absolute -top-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-radial to-transparent blur-3xl"
          />
          <div
            aria-hidden="true"
            className="from-accent-900/40 pointer-events-none absolute -right-32 -bottom-40 h-96 w-96 rounded-full bg-radial to-transparent blur-3xl"
          />
        </>
      )}

      {/* ================= THE FOREGROUND ================= */}
      <motion.div
        variants={stage}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="relative z-10 px-6 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          {/* ================= 1 · THE CLOSING STATEMENT ================= */}
          <motion.div variants={riseIn}>
            <span
              aria-hidden="true"
              className="mb-8 block h-px w-14 bg-[#FDFBF7]/60"
            />

            <p className="font-script max-w-4xl text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.15] font-light text-[#FDFBF7] italic">
              {SLOGAN}
              <br />
              <span className="text-sand-200">{SLOGAN_SECOND}</span>
            </p>
          </motion.div>

          {/* ================= 2 · THE GRID ================= */}
          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-12 lg:gap-10">
            <motion.div variants={riseIn} className="lg:col-span-5">
              <Link
                href={BRAND.href}
                className="group inline-block"
                aria-label={`${BRAND.name} — home`}
              >
                <span className="font-display block text-2xl font-semibold tracking-[-0.02em] text-[#FDFBF7] sm:text-3xl">
                  Myo{" "}
                  <span className="text-sand-200 font-light italic">Thant</span>{" "}
                  Naing
                </span>
                <span
                  aria-hidden="true"
                  className="mt-3 block h-px w-0 bg-[#FDFBF7] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-24"
                />
              </Link>

              <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-[#FDFBF7]/85">
                {BRAND_LINE.en}
              </p>
              {/* Not italic — there is no Myanmar italic face, so the browser
                  would shear the glyphs. Distinguished by size and opacity. */}
              <p
                lang="my"
                className="font-myanmar mt-3 max-w-sm text-[0.85rem] leading-[1.95] tracking-normal text-[#FDFBF7]/70"
              >
                {BRAND_LINE.my}
              </p>
            </motion.div>

            <motion.nav
              variants={riseIn}
              aria-label="Chapters"
              className="lg:col-span-3"
            >
              <ColumnHeading
                en={HEADINGS.chapters.en}
                my={HEADINGS.chapters.my}
              />
              <ul className="mt-6 space-y-4">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>

            <motion.div variants={riseIn} className="lg:col-span-4">
              <ColumnHeading
                en={HEADINGS.connect.en}
                my={HEADINGS.connect.my}
              />
              <ul className="mt-6 space-y-4">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={LINK_CLASS}
                    >
                      {social.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}

                <li className="pt-2">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="group inline-block text-[0.95rem] text-[#FDFBF7]/85 transition-colors duration-300 hover:text-[#FDFBF7] focus-visible:text-[#FDFBF7]"
                  >
                    <span className="underline-offset-[6px] decoration-[#FDFBF7]/40 group-hover:underline">
                      {CONTACT_EMAIL}
                    </span>
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* ================= 3 · HAIRLINE + CREDIT ROW ================= */}
          <motion.div
            variants={ruleIn}
            aria-hidden="true"
            className="mt-16 h-px w-full origin-left bg-[#FDFBF7]/20 lg:mt-20"
          />

          {isFortunePage ? <FooterMysticSlot /> : null}

          <motion.div
            variants={riseIn}
            className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-xs tracking-[0.04em] text-[#FDFBF7]/85">
              © {COPYRIGHT_YEAR} {BRAND.name}. All rights reserved.
            </p>

            <button
              type="button"
              onClick={backToTop}
              /* py trimmed 2 → 1.5 because the label is two lines now, so the
                 pill keeps roughly the height it had with one. */
              className="group inline-flex items-center gap-2.5 self-start rounded-full px-4 py-1.5 ring-1 ring-[#FDFBF7]/30 transition-colors duration-300 hover:ring-[#FDFBF7]/60 sm:self-auto"
            >
              <span className="flex flex-col items-center">
                <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] text-[#FDFBF7]/85 uppercase transition-colors duration-300 group-hover:text-[#FDFBF7]">
                  {BACK_TO_TOP.en}
                </span>
                <span
                  lang="my"
                  className="font-myanmar mt-1 text-[0.75rem] leading-[1.6] font-normal tracking-normal text-[#FDFBF7]/70 transition-colors duration-300 group-hover:text-[#FDFBF7]/85"
                >
                  {BACK_TO_TOP.my}
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 text-[#FDFBF7]/85 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </button>
          </motion.div>
        </div>
      </motion.div>
      </MysticFooterFrame>
    </FooterMysticProvider>
  );
}
