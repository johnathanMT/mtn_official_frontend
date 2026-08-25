"use client";

/**
 * ============================================================================
 *  FORTUNE PHILOSOPHY — editorial two-column, bilingual
 * ============================================================================
 *
 *  Sits directly below FortuneHero. Text left, artwork right, both vertically
 *  centred; one column on phones with the artwork following the prose.
 *
 *  ---------------------------------------------------------------------------
 *  THE BILINGUAL RULES
 *  ---------------------------------------------------------------------------
 *  The four rules are written out in full at the top of FortuneHero.tsx —
 *  lang="my" on every Burmese node, tracking-normal always, never italic, and
 *  far more leading than the Latin above it. Two of them bite particularly
 *  hard in this file:
 *
 *  · The h2 below inherits `letter-spacing: -0.02em` from the h1–h4 rule in
 *    globals.css. On the English span that is the intended optical tightening.
 *    On the Burmese span it pulls the upper and lower marks into the consonants
 *    they belong to, so the Burmese span resets it to tracking-normal.
 *
 *  · The drop cap is `first-letter:` on the ENGLISH paragraph only. Burmese has
 *    no capital forms and its first syllable is a cluster, not a letter — a
 *    ::first-letter float there would tear ရာ apart and leave the mark
 *    stranded. The translation is a separate <p> with no cap, which is also why
 *    the cap measurements below still hold: nothing about that paragraph moved.
 *
 *  ---------------------------------------------------------------------------
 *  THE CROP WAS IN THE URL, NOT IN THE CSS
 *  ---------------------------------------------------------------------------
 *  An earlier version asked Cloudinary for `c_fill,g_auto,ar_3:4` — the image
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
import FortuneKnight3D from "@/components/chapter/FortuneKnight3D";

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
 * COPY — every string in one place, in both languages
 *
 * On the Burmese body: this is a reading of your English, not a word-for-word
 * mapping of it, because a literal one reads as machine output in Burmese.
 * Three choices worth naming, so you can overrule any of them:
 *
 *   "ကောင်းကင်ယံကို မော်ကြည့်" — literally "gazed up at the vault of heaven",
 *   for "looked to the skies". Burmese has no idiom that carries the English
 *   sense of looking to something for answers; မော်ကြည့် is the register used
 *   for looking upward with intent, which is the closer meaning.
 *
 *   "ကံစမ်းခြင်းသက်သက် မဟုတ်ပေ" for "not merely a game of chance". ပေ is the
 *   literary negative particle — formal and slightly elevated, which suits a
 *   philosophical line. In speech you would write မဟုတ်ဘူး; here that would
 *   sound conversational against the English.
 *
 *   "ညီညွတ်ဆက်စပ်မှု" for "alignment" — a compound of ညီညွတ် (in accord) and
 *   ဆက်စပ် (connected). The single-word ချိန်ညှိမှု means a mechanical
 *   calibration, which is the wrong register entirely for this sentence.
 * ------------------------------------------------------------------------ */

const COPY = {
  label: {
    en: "The Architecture of Fate",
    my: "ကံကြမ္မာ၏ တည်ဆောက်ပုံ",
  },

  heading: {
    en: "Decoding the Patterns of Destiny",
    my: "ကံကြမ္မာ၏ ပုံစံများကို ဖော်ထုတ်ခြင်း",
  },

  body: {
    en: "For centuries, humanity has looked to the skies to understand the intricate patterns of our existence. The calculation of destiny has evolved from ancient celestial observations to modern analytical methods, yet the core truth remains unchanged. Fortune is not merely a game of chance; it is a profound alignment of time, space, and choices.",
    my: "ရာစုနှစ်ပေါင်းများစွာကတည်းက လူသားတို့သည် မိမိတို့တည်ရှိမှု၏ ရှုပ်ထွေးနက်နဲသော ပုံစံများကို နားလည်သိမြင်ရန် ကောင်းကင်ယံကို မော်ကြည့်ခဲ့ကြသည်။ ကံကြမ္မာကို တွက်ချက်ခြင်းသည် ရှေးဟောင်းကောင်းကင်စောင့်ကြည့်လေ့လာမှုများမှသည် ခေတ်သစ်ခွဲခြမ်းစိတ်ဖြာနည်းစနစ်များအထိ ပြောင်းလဲတိုးတက်လာခဲ့သော်လည်း အနှစ်သာရအမှန်တရားမှာမူ မပြောင်းလဲဘဲ တည်ရှိနေဆဲဖြစ်သည်။ ကံကြမ္မာဆိုသည်မှာ ကံစမ်းခြင်းသက်သက် မဟုတ်ပေ။ ၎င်းသည် အချိန်၊ အာကာသနှင့် ရွေးချယ်ဆုံးဖြတ်မှုတို့၏ နက်နဲသိမ်မွေ့သော ညီညွတ်ဆက်စပ်မှုတစ်ရပ် ဖြစ်သည်။",
  },
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
      className="overflow-visible bg-[#0a0a0a] px-6 py-24 md:px-12 lg:px-24 lg:py-32"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2 lg:gap-16">
        {/* ================= LEFT · TEXT ================= */}
        {/* One motion node for the whole column, as before — the English and
            its translation rise together rather than in sequence, which is
            what makes the pair read as one unit of copy. */}
        <motion.div
          variants={reduceMotion ? undefined : textIn}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={revealViewport}
        >
          {/* ---------- LABEL ---------- */}
          <p className="font-sans text-xs tracking-widest text-gray-400 uppercase">
            {COPY.label.en}
          </p>
          {/* No `uppercase` and no `tracking-widest`: neither does anything
              useful to Myanmar, and the tracking actively damages it.

              gray-400, NOT the gray-500 the brief suggested. Measured against
              this section's #0a0a0a, text-gray-500 composites to 4.09:1 — under
              the 4.5:1 WCAG AA floor for text this size. gray-400 measures
              7.61:1. See the note on the body paragraph below. */}
          <p
            lang="my"
            className="font-myanmar mt-2 text-[0.8125rem] leading-[1.7] tracking-normal text-gray-400"
          >
            {COPY.label.my}
          </p>

          {/* ---------- HEADING ---------- */}
          {/* Both languages inside the h2, so the section's accessible name —
              which `aria-labelledby` above points at — is the full bilingual
              heading rather than only its English half. */}
          <h2 id="fortune-philosophy-heading" className="mt-6">
            {/* clamp rather than a fixed text-5xl: this heading is 32
                characters in English but 37 in Burmese, and Burmese clusters
                are wider than Latin letters at the same size, so the two lines
                need to be free to settle at different sizes on a phone. */}
            <span className="font-display block text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.15] font-medium tracking-[-0.02em] text-balance text-white">
              {COPY.heading.en}
            </span>
            {/* leading 1.5, not 1.15. At the English leading the upper mark on
                ကံ clips into the descender of the line above. tracking-normal
                cancels the -0.02em the h1–h4 base rule puts on this element. */}
            <span
              lang="my"
              className="font-myanmar mt-3 block text-[clamp(1.05rem,1.9vw,1.5rem)] leading-[1.5] font-normal tracking-normal text-balance text-gray-400"
            >
              {COPY.heading.my}
            </span>
          </h2>

          {/* ---------- BODY ---------- */}
          <p
            /* 3.6rem is the largest cap that still clears line 3 — see the
               measured numbers in the header. */
            className="mt-8 text-[1.125rem] leading-[1.75] text-pretty text-gray-300 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[3.6rem] first-letter:leading-[1] first-letter:font-medium first-letter:text-white"
          >
            {COPY.body.en}
          </p>

          {/* mt-4 and a softer grey, per the brief. No drop cap and no italic —
              see the bilingual note at the top of this file. The leading jump
              from 1.75 to 1.95 is the single biggest thing that makes a
              Burmese paragraph look typeset rather than dumped.

              THE ONE PLACE THE BRIEF ASKED FOR SOMETHING UNREADABLE. You
              offered gray-400 or gray-500 for the translation. On white either
              is fine; on this section's #0a0a0a they are not equivalent —
              I rendered the page and sampled the composited pixels:

                  text-gray-500 on #0a0a0a ....... 4.09:1   FAILS AA
                  text-gray-400 on #0a0a0a ....... 7.61:1   passes
                  text-gray-300 on #0a0a0a ....... 11.4:1   (the English above)

              4.5:1 is the AA floor for text under 24px, so gray-500 was 0.4
              short — invisible on a good monitor in a dark room, genuinely hard
              to read on a phone in daylight. gray-400 is still a clear step
              down from the gray-300 English, which is what the hierarchy asked
              for, and it is legible. */}
          <p
            lang="my"
            className="font-myanmar mt-4 text-[1rem] leading-[1.95] tracking-normal text-pretty text-gray-400"
          >
            {COPY.body.my}
          </p>
        </motion.div>

        {/* ================= RIGHT · ARTWORK ================= */}
        {/* OUTER — the scroll reveal. Owns opacity and scale. */}
        <motion.div
          variants={reduceMotion ? undefined : imageIn}
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={revealViewport}
          className="flex flex-col overflow-visible"
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

          <div className="mt-8 flex w-full justify-end overflow-visible">
            <FortuneKnight3D />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
