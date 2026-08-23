"use client";

/**
 * ============================================================================
 *  FORTUNE PHILOSOPHY — editorial two-column
 * ============================================================================
 *
 *  Sits directly below FortuneHero. Text left, artwork right, both vertically
 *  centred; one column on phones with the artwork following the prose.
 *
 *  ---------------------------------------------------------------------------
 *  THE CROP WAS IN THE URL, NOT IN THE CSS
 *  ---------------------------------------------------------------------------
 *  The previous version asked Cloudinary for `c_fill,g_auto,ar_3:4` — the image
 *  arriving at the browser had ALREADY been cut to a 3:4 portrait before any
 *  CSS ran. `object-contain` would not have rescued it; it would have
 *  letterboxed an image that was itself a crop. The transformation is gone, so
 *  the loader's default `c_limit` applies, and c_limit only ever scales down —
 *  it never removes pixels.
 *
 *  With the whole frame back, the container can no longer be a fixed aspect
 *  box, and `fill` goes with it: a fill image needs a parent that already has a
 *  height, and the point here is that the height should come from the artwork.
 *  width={0} height={0} plus `h-auto w-full` is the documented way to say "the
 *  intrinsic size is unknown, lay it out at whatever ratio it turns out to be".
 *  The trade is some layout shift on first paint. Do NOT try to buy that back
 *  with a min-height on the wrapper — see the note at the wrapper itself.
 *
 *  ---------------------------------------------------------------------------
 *  WHY mix-blend-color AND NOT multiply
 *  ---------------------------------------------------------------------------
 *  `color` takes the hue and saturation of the overlay and keeps the LUMINOSITY
 *  of the photograph underneath, so line work and symbols survive the tint.
 *  `multiply` darkens as it tints, and on a #0a0a0a section the darker passages
 *  of the artwork close up into black. Both are one word to swap — see TINT.
 *
 *  `isolate` on the wrapper is not decoration. Without a stacking context the
 *  blend reaches past the image into whatever is painted behind it — the
 *  section's near-black background — and the tint goes muddy at the edges.
 *
 *  ---------------------------------------------------------------------------
 *  THE FLOAT IS ON ITS OWN NODE
 *  ---------------------------------------------------------------------------
 *  The entrance (whileInView) and the perpetual drift cannot live on the same
 *  element: Motion resolves whileInView over animate, so the drift would be
 *  suppressed for exactly as long as the element is on screen — which is the
 *  entire time you can see it. Outer node reveals, inner node floats.
 *
 *  ---------------------------------------------------------------------------
 *  THE DROP CAP
 *  ---------------------------------------------------------------------------
 *  `first-letter:`, not <span>F</span>or — a span splits the word in the
 *  accessibility tree and breaks find-in-page for the paragraph's first word.
 *
 *  A line box is pushed aside if it INTERSECTS the float by even one pixel, and
 *  the float's rendered box is TALLER than its font-size: at 3.6rem the
 *  font-size is 57.6px and the measured box is 63px, because the
 *  ::first-letter rect carries the full em box plus overshoot. You cannot
 *  derive that number; measure it. Measured at 1440px:
 *
 *      cap        top  -3px   height 63px   bottom 60px
 *      line 1     top    5px   left 44px   (indented)
 *      line 2     top 36.5px   left 44px   (indented)
 *      line 3     top   68px   left  0px   (clear)
 *
 *  An earlier 3.9rem + mt-[0.1em] reached into line 3 and indented three lines
 *  instead of two. Change the body size or leading and this needs re-measuring.
 * ============================================================================
 */

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";

/* ---------------------------------------------------------------------------
 * MEDIA
 *
 * Cloudinary public ID, not a URL. NOTE THE ABSENCE of a `#…` transformation
 * suffix — that is deliberate. The project's loader (next.config.ts ->
 * images.loaderFile) applies `f_auto,q_auto,c_limit,w_<width>`, and c_limit is
 * the only crop mode that cannot cut anything off.
 * ------------------------------------------------------------------------ */

const IMAGE = {
  src: "v1787476982/IMG_20220207_134626_Original_ixjejo.jpg",
  alt: "A figure on horseback among astrological symbols",
} as const;

/* Swap this one line to retune the tint.
     mix-blend-color     hue shift, keeps all detail          (current)
     mix-blend-overlay   more contrast, pushes darks darker
     mix-blend-multiply  richest and heaviest, can crush darks
   The /40 is strength — /25 is a whisper, /60 is a full duotone. */
const TINT = "bg-fuchsia-800/40 mix-blend-color";

/* ---------------------------------------------------------------------------
 * COPY
 * ------------------------------------------------------------------------ */

const COPY = {
  label: "The Architecture of Fate",
  heading: "The Geometry of Fate: Bridging Ancient Mysticism & Modern Stars",
  body: "For centuries, humanity has sought to decode the celestial tapestry. The calculation of destiny has evolved from the profound rituals of ancient times to modern analytical methods, yet the core truth remains unchanged. Fortune is not a mere roll of the dice; it is a sacred alignment of time, space, and the hidden symbols that guide our choices.",
} as const;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

const textIn: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const imageIn: Variants = {
  hidden: { opacity: 0, scale: 1.05 },
  show: {
    opacity: 1,
    scale: 1,
    /* Delayed behind the text so the columns arrive in sequence — the stagger
       is what reads as cinematic — and slower, because a long settle out of an
       over-scale looks like a camera finding focus rather than a UI tween. */
    transition: { duration: 1.4, delay: 0.25, ease: EASE },
  },
};

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function FortunePhilosophy() {
  const reduceMotion = useReducedMotion() ?? false;

  const revealViewport = { once: true, margin: "-100px" } as const;

  return (
    <section
      id="fortune-philosophy"
      aria-labelledby="fortune-philosophy-heading"
      className="bg-[#0a0a0a] px-6 py-24 md:px-12 lg:px-24 lg:py-32"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2 lg:gap-16">
        {/* ================= LEFT · TEXT ================= */}
        <motion.div
          variants={reduceMotion ? undefined : textIn}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={revealViewport}
        >
          <p className="font-sans text-xs tracking-widest text-gray-400 uppercase">
            {COPY.label}
          </p>

          <h2
            id="fortune-philosophy-heading"
            /* The heading is now 62 characters rather than 30, so the fixed
               text-6xl it used to carry would run to five lines on desktop and
               swamp the column. clamp tops out lower, and text-balance evens
               the line lengths instead of leaving one orphan. */
            className="font-display mt-6 text-[clamp(1.85rem,3.4vw,3rem)] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-white"
          >
            {COPY.heading}
          </h2>

          <p
            /* 3.6rem is the largest cap that still clears line 3 — see the
               measured numbers in the header. */
            className="mt-8 text-[1.125rem] leading-[1.75] text-pretty text-gray-300 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[1] first-letter:font-medium first-letter:text-white"
          >
            {COPY.body}
          </p>
        </motion.div>

        {/* ================= RIGHT · ARTWORK ================= */}
        {/* OUTER — the scroll reveal. Owns opacity and scale. */}
        <motion.div
          variants={reduceMotion ? undefined : imageIn}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={revealViewport}
        >
          {/* INNER — the perpetual drift. Owns y, and nothing else.
              whileInView rather than animate so the loop stops when the
              section leaves the screen; `once: false` is what lets it stop and
              restart. An always-on `animate` keeps a requestAnimationFrame
              callback alive for the whole life of the page. */}
          <motion.div
            whileInView={reduceMotion ? undefined : { y: [0, -12, 0] }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            /* isolate confines the blend to this box — see the header.

               NO min-height. I tried min-h-[18rem] to reserve space against
               the layout shift, and it caused exactly the bug this rewrite
               existed to remove: the tint is inset-0 of THIS box, so whenever
               the box was taller than the artwork the overlay painted fuchsia
               over the empty backing colour beneath it. Measured on a 390px
               phone: wrapper 342x288, artwork 342x192 — a 96px magenta band
               under the picture. The box must hug the image, so its height
               comes from the image and nothing else. */
            className="relative isolate w-full overflow-hidden rounded-xl bg-[#141414]"
          >
            <Image
              src={IMAGE.src}
              alt={IMAGE.alt}
              /* Not `fill`. See the header: the container's height comes from
                 the artwork, so there is no box for a fill image to fill.
                 0/0 declares "intrinsic size unknown"; the classes below give
                 it the column's width at its own ratio. */
              width={0}
              height={0}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-auto w-full"
            />

            {/* The tint. Last child, so it paints above the image without
                needing a z-index. pointer-events-none so it never eats a
                click meant for the artwork. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 ${TINT}`}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
