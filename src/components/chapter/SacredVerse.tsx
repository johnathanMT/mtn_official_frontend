"use client";

/**
 * ============================================================================
 *  SACRED VERSE — full-bleed banner, gold-embossed Pali
 * ============================================================================
 *
 *  Replaces the gallery scaffold at the foot of /fortune. It keeps the
 *  `fortune-gallery` id, because the hero's Discover button scrolls to it —
 *  drop the id and that button silently goes nowhere.
 *
 *  ---------------------------------------------------------------------------
 *  THE THREE THINGS IN THIS FILE THAT ARE NOT OBVIOUS
 *  ---------------------------------------------------------------------------
 *  1 · THE EMBOSS AND THE GLOW CANNOT LIVE ON THE SAME ELEMENT.
 *      `drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]` compiles to `filter:
 *      drop-shadow(...)`. Motion animates the glow by writing `filter` to the
 *      inline style — and an inline `filter` REPLACES the class's filter
 *      outright rather than adding to it. Put both on one node and the emboss
 *      vanishes the instant the animation starts, which reads as the text
 *      going flat a half-second after it appears.
 *
 *      So: the emboss is a class on the <p>, the glow is an animated filter on
 *      the <blockquote> wrapping it. A parent filter applies to the whole
 *      rendered subtree, so the glow wraps the already-embossed glyphs. Two
 *      nodes, no collision.
 *
 *  2 · THE ENTRANCE AND THE GLOW CANNOT LIVE ON THE SAME ELEMENT EITHER.
 *      Motion resolves `whileInView` over `animate`, so a perpetual loop on a
 *      node that also has an in-view variant is suppressed for exactly as long
 *      as the element is on screen — the whole time you can see it. Same fix as
 *      FortunePhilosophy: outer node reveals, inner node loops.
 *
 *  3 · THE SCRIM IS DARKEST IN THE MIDDLE, AND IT HAS TO BE.
 *      The brief suggested `bg-black/50`. Gold is not white, and the dark end
 *      of this gradient — #b38728 — has a relative luminance of 0.270. Over a
 *      50%-black scrim on a blown-out image the surface underneath sits at
 *      0.212, which is 1.22:1. Invisible. Worked backwards from the 3:1 floor
 *      for large text, the scrim has to reach about 0.74 combined where the
 *      type sits.
 *
 *      A flat 74% would bury the photograph, so it is split: a flat 40% over
 *      the whole frame, plus a centred radial that adds another ~62% exactly
 *      where the verse is. Combined at the centre 1-(0.60)(0.38) = 0.77; at the
 *      corners it stays at 0.40 and the image still reads. That is the same
 *      lesson as the Fortune hero — the reflex is to darken the EDGES, and the
 *      type is in the middle.
 * ============================================================================
 */

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";

/* ---------------------------------------------------------------------------
 * MEDIA
 *
 * Cloudinary public ID, not a URL — the loader (next.config.ts ->
 * images.loaderFile) adds f_auto,q_auto,c_limit,w_<width>. No `#…` suffix, so
 * nothing is cropped server-side and object-center does the only framing.
 * ------------------------------------------------------------------------ */

const BACKDROP = {
  src: "v1787476969/IMG_4574_adpsna.jpg",
  /* Decorative: the verse carries the meaning, and a description of the
     photograph announced before it would be noise. Empty alt is how you say
     "skip this" — it is not the same as a missing alt attribute. */
  alt: "",
} as const;

/* ---------------------------------------------------------------------------
 * THE VERSE
 *
 * This is Pali written in Myanmar script — the closing lines of the Maṅgala
 * Sutta. It is set exactly as you sent it.
 *
 * TWO THINGS YOU SHOULD LOOK AT BEFORE THIS GOES LIVE. I am flagging rather
 * than silently editing, because this is scripture and the call is yours.
 *
 *   a) You have "စိတ္တံယသနကမ္ပတိ". The canonical line is "စိတ္တံ ယဿ န ကမ္ပတိ"
 *      — cittaṃ yassa NA kampati, "whose mind does not tremble". The negating
 *      particle န is what carries the meaning of the whole verse; without the
 *      word break it reads as ယသန rather than ယဿ န.
 *
 *   b) You have "ဝရာဇံ" (varājaṃ). The canonical word is "ဝိရဇံ" (virajaṃ),
 *      "stainless" — it pairs with အသောကံ (sorrowless) and ခေမံ (secure) as
 *      the three qualities of the mind the verse describes.
 *
 * (a) HAS A VISIBLE CONSEQUENCE, not just a doctrinal one. Myanmar has no
 * inter-word spaces of its own, so the browser can only break a line where you
 * put one. "စိတ္တံယသနကမ္ပတိ" is one unbroken run of 14 clusters, so at 1440px
 * the line wraps inside it — rendered, the break lands between ယသ and နကမ္ပတိ,
 * splitting the word across two lines. With the canonical spacing the break
 * falls between words instead. I checked this on the rendered page; it is not
 * a hypothetical.
 *
 * The canonical form, if you want it, is the second line below: swap which one
 * VERSE points at and nothing else changes.
 * ------------------------------------------------------------------------ */

const VERSE_AS_SENT = "ဖုဌဿလောက ဓမ္မေဟိ စိတ္တံယသနကမ္ပတိ အသောကံ ဝရာဇံခေမံ ။";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- the alternate
   reading, kept beside the one in use so the choice is visible in the file. */
const VERSE_CANONICAL =
  "ဖုဋ္ဌဿ လောကဓမ္မေဟိ စိတ္တံ ယဿ န ကမ္ပတိ၊ အသောကံ ဝိရဇံ ခေမံ ။";

const VERSE = VERSE_AS_SENT;

/* Pali in the Myanmar script. `pi` is the language, `Mymr` the script — a
   screen reader with no Pali voice falls back on the script, which is closer
   than letting it read Burmese glyphs with an English voice. */
const VERSE_LANG = "pi-Mymr";

/* ---------------------------------------------------------------------------
 * GOLD
 *
 * Three stops, per the brief: an antique gold, a near-white highlight, then a
 * deeper gold. Left to right, so the highlight sweeps across the middle of the
 * line rather than sitting at one end.
 *
 * The emboss is a hard, tight, dark shadow — 4px down, 4px blur. Soft and
 * large reads as a glow; short and sharp reads as relief.
 * ------------------------------------------------------------------------ */

const GOLD =
  "bg-linear-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent";

const EMBOSS = "drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]";

/* ---------------------------------------------------------------------------
 * SCRIM — see note 3 in the header for where the numbers come from.
 * ------------------------------------------------------------------------ */

const SCRIM = {
  flat: "bg-black/40",
  centre:
    "bg-[radial-gradient(60%_58%_at_50%_50%,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.45)_45%,transparent_78%)]",
} as const;

/* ---------------------------------------------------------------------------
 * THE SEAMS
 *
 * A photograph that starts and stops at a hard edge is the single most
 * expensive-looking mistake on a page like this. Both edges are faded into the
 * exact colour of the neighbour, so the banner has no boundary of its own.
 *
 * WHY EXPLICIT rgba STOPS RATHER THAN `to-transparent`. Tailwind's
 * `transparent` is transparent BLACK. Ramping #1a140a to it in sRGB drags the
 * midpoint toward black as well as toward see-through, which shows up over a
 * photograph as a faint dark bruise in the middle of the fade. Naming the same
 * colour at alpha 0 keeps the hue fixed and moves only the alpha — a clean
 * ramp with nothing to notice.
 *
 * THE TWO COLOURS ARE BORROWED, NOT CHOSEN:
 *   #1a140a  this section's own base, which MoonAscendant now ends on.
 *   #0a0000  the FIRST stop of the footer's slab. PremiumFooter's SLAB is
 *            `bg-linear-to-b from-[#0a0000] to-[#1a0408]`, so #0a0000 is the
 *            literal colour of the footer's top edge. rose-950 (#4c0519) is
 *            three times lighter and would have produced a visible band where
 *            the fade met the footer instead of removing one.
 *
 * The mid stops (0.75 / 0.80) are not decoration either — a straight linear
 * alpha ramp reads as a grey wash. Holding most of the opacity through the
 * first third and releasing it over the rest is what makes it read as the
 * image dissolving rather than as a rectangle laid on top.
 * ------------------------------------------------------------------------ */

const FADE = {
  /* Into MoonAscendant above. Shorter than the bottom fade: the section is
     only ~430px tall on a small phone, and two full-height fades would leave
     the verse no clear middle to sit in. */
  top: "h-24 md:h-40 bg-[linear-gradient(to_bottom,rgba(26,20,10,1)_0%,rgba(26,20,10,0.75)_35%,rgba(26,20,10,0)_100%)]",
  /* Into the footer below, at the height you specified. */
  bottom:
    "h-32 md:h-48 bg-[linear-gradient(to_top,rgba(10,0,0,1)_0%,rgba(10,0,0,0.80)_30%,rgba(10,0,0,0)_100%)]",
} as const;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

const riseIn: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};

/* The breathing glow. Three keyframes — dim, bright, dim — all a single
   drop-shadow with the same argument shape, which is what lets Motion
   interpolate them numerically instead of cross-fading between two strings.
   The third keyframe is not redundant: without it the loop snaps from bright
   back to dim on every repeat.

   NOT `as const`. That makes the array readonly, and Motion's TargetAndTransition
   types a keyframe list as a mutable string[] — tsc rejects the readonly tuple
   with "is missing the following properties from type 'string[]'". */
const GLOW = {
  filter: [
    "drop-shadow(0px 0px 5px rgba(252,246,186,0.30))",
    "drop-shadow(0px 0px 20px rgba(252,246,186,0.80))",
    "drop-shadow(0px 0px 5px rgba(252,246,186,0.30))",
  ],
};

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function SacredVerse() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      /* KEEP THIS ID. The hero's Discover button href is "#fortune-gallery";
         renaming it breaks that scroll with no error anywhere. */
      id="fortune-gallery"
      aria-label="Sacred verse"
      /* min-h rather than h-screen: at 320px the verse runs to five lines and
         a fixed height would clip it. svh rather than vh because iOS Safari
         measures vh with the URL bar hidden, so a 60vh band is taller than the
         60% of the screen you actually see.

         The base colour is under the photograph, not instead of it — it is
         what the band looks like for the few hundred milliseconds before the
         image decodes, and if Cloudinary ever fails it is what you are left
         with. Dark antique gold keeps that failure on-theme. */
      className="relative flex min-h-[60svh] w-full items-center overflow-hidden bg-[#1a140a] py-24 lg:py-32"
    >
      {/* ================= THE PHOTOGRAPH ================= */}
      <Image
        src={BACKDROP.src}
        alt={BACKDROP.alt}
        fill
        /* Full-bleed, so 100vw is honest at every breakpoint. No `priority`:
           this sits at the foot of a long page, well below three other
           sections, and the early bandwidth belongs to the hero video. */
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* ================= THE SCRIM ================= */}
      {/* Flat first, radial on top. Both are plain siblings rather than
          negative z-index layers: they paint after the image and before the
          `relative z-10` content, which is the order we want, and a -z- child
          needs a stacking context on the parent to stay inside it at all. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${SCRIM.flat}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${SCRIM.centre}`}
      />

      {/* ================= THE SEAM FADES ================= */}
      {/* Both sit at z-10, the same layer as the verse — but they come BEFORE
          it in the DOM, so the type paints over them. That ordering matters at
          320px, where the section is ~430px tall and the bottom fade reaches
          up to within a few pixels of the last line. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 ${FADE.top}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 ${FADE.bottom}`}
      />

      {/* ================= THE VERSE ================= */}
      {/* OUTER — the entrance. Owns opacity and y, nothing else. */}
      <motion.div
        variants={reduceMotion ? undefined : riseIn}
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, margin: "-120px" }}
        className="relative z-10 mx-auto w-full max-w-5xl px-6 lg:px-10"
      >
        {/* INNER — the glow. Owns `filter`, nothing else.
            whileInView rather than animate so the loop stops when the band
            leaves the screen; `once: false` is what lets it stop and restart.
            An always-on `animate` keeps a requestAnimationFrame callback alive
            for the entire life of the page. */}
        <motion.blockquote
          whileInView={reduceMotion ? undefined : GLOW}
          viewport={{ once: false, amount: 0.3 }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}
          className="text-center"
        >
          <p
            lang={VERSE_LANG}
            /* font-myanmar is the --font-myanmar token from globals.css.
               tracking-normal is not decoration: Myanmar builds a syllable
               from a consonant plus marks above, below and beside it, and
               letter-spacing is inserted BETWEEN those marks. Nothing here
               sets tracking today, but this text will get copied into a
               heading one day and h1-h4 carry -0.02em.

               leading-relaxed (1.625) is the floor for Myanmar at this size —
               the upper marks on ဌ and the stacked ္တ need the room. */
            className={`font-myanmar text-3xl leading-relaxed font-bold tracking-normal text-balance md:text-5xl lg:text-6xl ${GOLD} ${EMBOSS}`}
          >
            {VERSE}
          </p>
        </motion.blockquote>
      </motion.div>
    </section>
  );
}
