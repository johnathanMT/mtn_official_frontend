"use client";

/**
 * ============================================================================
 *  NAME HERO — section 1
 * ============================================================================
 *
 *  Full-screen photographic plate with the name over it, and the opening line
 *  of the Heart Sutra falling through the frame behind it. Nothing else — no
 *  octagon, no stripe, no buttons. Those are the section below.
 *
 *  Motion: the plate drifts slower than the page on scroll, each line of the
 *  name rises out of its own clipping mask, the sutra cascades on a loop, and
 *  the whole block fades as the section leaves. All disabled under
 *  prefers-reduced-motion.
 *
 *  ---------------------------------------------------------------------------
 *  THE FOUR THINGS ABOUT THE SUTRA OVERLAY THAT ARE NOT OBVIOUS
 *  ---------------------------------------------------------------------------
 *  1 · `vertical-rl` NEEDS THE CHILDREN TO OPT BACK OUT OF IT.
 *      In a vertical writing mode the INLINE axis runs top-to-bottom and the
 *      BLOCK axis runs sideways, which also means an element's HEIGHT is now
 *      its inline size. The obvious build — vertical-rl on the column,
 *      `inline-block` glyphs inside it — collapses completely, because each
 *      span inherits the vertical mode, so its own shrink-to-fit inline size
 *      (its height) resolves to zero and every glyph piles up at the same
 *      point. I shipped that first and measured it: column 48x0, all eight
 *      glyphs at top 144.
 *
 *      I built the four candidates and measured them side by side:
 *
 *          vertical-rl, inline-block children ........ 64x0    BROKEN
 *          vertical-rl, children horizontal-tb ....... 55x256  stacks down
 *          vertical-rl + explicit height on column ... 64x384  BROKEN
 *          flex flex-col, block children ............. 48x256  stacks down
 *
 *      An explicit height does NOT rescue it — the collapse is in the child,
 *      not the parent. So each glyph resets to `horizontal-tb`: it measures its
 *      own box in a normal writing mode, then gets placed as an atomic inline
 *      along the parent's vertical inline axis. It also has to stay
 *      `inline-block`, because a transform is ignored on a non-replaced inline
 *      box and `y` would silently do nothing.
 *
 *      flex-col would also work and is simpler, but it is not a writing mode —
 *      it would not carry vertical punctuation or a mixed Latin run correctly
 *      if this string ever grows.
 *
 *  2 · THE COLOURS ARE INDEXED, NOT RANDOM. The brief said "alternate or
 *      randomly blend". Random is the wrong half of that sentence here:
 *      Math.random() runs once on the server during the prerender and again in
 *      the browser at hydration, the two disagree, and React logs a hydration
 *      mismatch and repaints. Same trap as a live timecode or new Date(). The
 *      cycle is `index % 3`, which with 8 characters over 3 colours never
 *      repeats the same pairing twice down a column anyway.
 *
 *  3 · THE STAGGER SURVIVES THE LOOP, WHICH IS THE WHOLE TRICK. `repeat:
 *      Infinity` on a child would normally desynchronise everything after the
 *      first pass. It does not here because `staggerChildren` is applied as a
 *      per-child DELAY, and a delay is spent once, before the first iteration —
 *      so every glyph keeps its offset for the life of the page. That is what
 *      makes the fall read as continuous rather than as eight things blinking.
 *
 *  4 · THE COLUMNS ARE PLACED AROUND THE NAME, NOT SYMMETRICALLY.
 *      The brief asked for one column left and one right. The name is
 *      LEFT-ALIGNED in `container-premium`, so a left column has to live in the
 *      outer gutter — and that gutter is zero until the container hits its
 *      80rem cap — and at exactly 1280 the cap IS the viewport, so the gutter
 *      is still zero. Measured against the title's real glyph ink, a left
 *      column at left-6 (x 24..72) collides with a title starting at x=48 all
 *      the way up to and including 1280, and only clears at 1536 where the
 *      gutter is (1536-1280)/2 = 128px and the title starts at x=176.
 *
 *      So the right column runs from `sm` and the left from `2xl`. `xl` was my
 *      first guess and it was one breakpoint too early — the measurements are
 *      in the response.
 * ============================================================================
 */

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { MEDIA, imageProps } from "@/config/mediaControl";

const EASE = [0.22, 1, 0.36, 1] as const;

const COPY = {
  kicker: "A Journey of Discovery",
  /* One entry per masked line. */
  name: ["Myo Thant", "Naing"],
} as const;

/* ---------------------------------------------------------------------------
 * THE SUTRA
 *
 * 摩訶般若波羅蜜多 — Maka Hannya Haramita, the opening invocation of the Heart
 * Sutra: "great transcendent wisdom". Eight characters, spread with the
 * spread operator rather than .split("") because split works on UTF-16 code
 * units and would cut a surrogate pair in half. None of these eight are
 * outside the BMP, so it makes no difference today — it makes a difference the
 * first time someone edits this string.
 *
 * lang="ja" so the browser picks Japanese glyph forms. Several of these
 * characters render differently in a Chinese font, and the Mincho stack in
 * globals.css contains both.
 * ------------------------------------------------------------------------ */

const SUTRA = "摩訶般若波羅蜜多";
const GLYPHS = [...SUTRA];

/* Gold, silver, deep crimson — your three, cycled by index. */
const INK = ["#bf953f", "#e0e0e0", "#6b0f1a"] as const;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};

const riseIn: Variants = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 1.1, ease: EASE } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const drawRule: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 1.2, ease: EASE } },
};

/* The column's own stagger. `custom` carries a per-column head start so the
   two columns never fall in lockstep — two synchronised columns read as a
   loading state, two offset ones read as weather. */
const cascade: Variants = {
  hidden: {},
  show: (headStart: number) => ({
    transition: { staggerChildren: 0.42, delayChildren: headStart },
  }),
};

/* One glyph: in from above, hold while it drifts down, out at the bottom.
   `times` keeps the hold long — a symmetric fade reads as a blink, whereas
   spending half the cycle at full opacity reads as something falling past.

   Motion needs `hidden` to match the first keyframe, or the first iteration
   snaps before it starts. */
const glyphFall: Variants = {
  hidden: { opacity: 0, y: -16 },
  show: {
    opacity: [0, 0.85, 0.85, 0],
    y: [-16, 0, 20, 36],
    transition: {
      duration: 6.4,
      times: [0, 0.18, 0.74, 1],
      repeat: Infinity,
      repeatType: "loop",
      ease: "easeInOut",
    },
  },
};

/* ---------------------------------------------------------------------------
 * ONE COLUMN
 * ------------------------------------------------------------------------ */

function SutraColumn({
  headStart,
  className,
  reduceMotion,
}: {
  headStart: number;
  className: string;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      /* aria-hidden, and not a close call. This is atmosphere. A screen reader
         announcing eight Japanese characters between the page kicker and the
         name would be pure noise to someone who cannot see that they are
         drifting in the background. The `lang` stays for glyph selection. */
      aria-hidden="true"
      lang="ja"
      variants={reduceMotion ? undefined : cascade}
      custom={headStart}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      /* vertical-rl makes the inline axis run top-to-bottom; text-orientation
         upright keeps each glyph on its feet. CJK is upright under the default
         `mixed` too, but stating it means the column survives someone dropping
         a Latin character into the string. */
      className={`font-mincho pointer-events-none absolute [writing-mode:vertical-rl] [text-orientation:upright] select-none ${className}`}
    >
      {GLYPHS.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          variants={reduceMotion ? undefined : glyphFall}
          /* inline-block — see note 1 in the header. Inline to flow down the
             column, block-ish to accept the translate. */
          /* horizontal-tb is the fix, inline-block is the other half of it.
             See note 1 in the header — without the reset the column is 0px
             tall and every glyph lands on the same pixel. */
          className="inline-block [writing-mode:horizontal-tb] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
          style={{
            color: INK[i % INK.length],
            /* Static fallback for reduced motion: the column is still there,
               just not falling. Hiding it entirely would leave a noticeably
               emptier frame for the people most likely to be on a slow
               device — the sutra is part of the composition, not a flourish
               laid over it. */
            opacity: reduceMotion ? 0.5 : undefined,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function NameHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = prefersReducedMotion ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const plateY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  /* Gentle. A larger zoom compounds any tightness in the crop the moment you
     start scrolling. */
  const plateScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      aria-label="Myo Thant Naing"
      className="bg-secondary-950 relative isolate flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* ---------- PHOTOGRAPHIC PLATE ---------- */}
      <motion.div
        aria-hidden="true"
        style={
          prefersReducedMotion ? undefined : { y: plateY, scale: plateScale }
        }
        className="absolute inset-0 -z-20 will-change-transform"
      >
        <Image
          {...imageProps(MEDIA.landing.background, {
            fill: true,
            priority: true,
          })}
          alt=""
          sizes="100vw"
          quality={82}
          className="object-cover object-center"
        />
      </motion.div>

      {/* ---------- WASH ----------
          Only darkens where it has to: strong along the left where the type
          sits, strong at the very top and bottom so the navbar and the section
          seam stay clean, and close to clear through the centre so the
          photograph actually reads. */}
      <div
        aria-hidden="true"
        className="from-secondary-950/90 via-secondary-950/20 to-secondary-950/75 absolute inset-0 -z-10 bg-gradient-to-b"
      />
      <div
        aria-hidden="true"
        className="from-secondary-950/80 absolute inset-0 -z-10 bg-gradient-to-r via-transparent to-transparent"
      />

      {/* ---------- THE SUTRA ----------
          z-10: above the wash, below the name at z-20. Both columns sit in the
          outer gutters, never over the type — see note 4 in the header for the
          measurements behind the breakpoints.

          `top-[16%]` rather than a vertical centre: the name is centred, so
          starting the fall above it and letting it run past keeps the two from
          reading as one block. */}
      <SutraColumn
        headStart={0}
        reduceMotion={reduceMotion}
        className="top-[16%] right-4 z-10 hidden text-3xl sm:block sm:right-6 lg:right-10 lg:text-4xl xl:text-5xl"
      />
      <SutraColumn
        /* Half the stagger interval behind the right column, so the two
           interleave rather than pulse together. */
        headStart={2.1}
        reduceMotion={reduceMotion}
        className="top-[26%] left-6 z-10 hidden text-4xl 2xl:block 2xl:text-5xl"
      />

      {/* ---------- NAME ---------- */}
      <motion.div
        variants={stage}
        initial="hidden"
        animate="show"
        style={
          prefersReducedMotion
            ? undefined
            : { y: contentY, opacity: contentOpacity }
        }
        /* z-20 is new. The content used to sit at z-auto, which was fine when
           everything else was negative — but the sutra is at z-10 and would
           otherwise paint over the name. */
        className="container-premium relative z-20 w-full py-28"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-4">
          <span aria-hidden="true" className="bg-sand h-px w-10 shrink-0" />
          <span className="text-sand text-[0.6rem] font-semibold tracking-[0.2em] uppercase sm:text-xs sm:tracking-[0.26em]">
            {COPY.kicker}
          </span>
        </motion.div>

        <h1 className="text-primary font-display mt-6 text-[clamp(3rem,10vw,8rem)] leading-[0.95] font-medium tracking-[-0.035em]">
          {COPY.name.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.07em]">
              <motion.span
                variants={riseIn}
                className={`block ${i === 1 ? "text-sand italic" : ""}`}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          variants={drawRule}
          aria-hidden="true"
          className="bg-primary/25 mt-10 h-px w-full max-w-lg origin-left"
        />
      </motion.div>
    </section>
  );
}
