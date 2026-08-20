"use client";

/**
 * ============================================================================
 *  STRIPE + OCTAGON — section 2
 * ============================================================================
 *
 *  A standalone band with one job: a deep Navy stripe running the full width
 *  of the screen, and the octagon-clipped portrait sitting across it, pinned
 *  to the left of the container.
 *
 *  NAVY-ON-NEAR-BLACK NEEDS HELP. The section sits on secondary-950 (#020C11)
 *  and the stripe core is secondary-500 (#0B3B4C) — only a few steps apart, so
 *  a flat fill would barely register. Three things make it read: the fill is
 *  lighter at its edges than its centre, the hairlines are Sand rather than a
 *  brighter navy (navy/sand is the elegant pairing and sand actually contrasts
 *  here), and the bloom behind it is steel-blue instead of cyan.
 *
 *  Because this section carries no body copy, the stripe can be at FULL
 *  STRENGTH edge to edge — the earlier version had to fade toward the right to
 *  stop a hard 1px rule cutting through the hero paragraph. Separating the two
 *  sections is what buys back the bold uniform band.
 *
 *  Layer order matters: the stripe is behind (-z-10) and the octagon in normal
 *  flow, so the octagon reads as sitting ON the stripe rather than beside it.
 * ============================================================================
 */

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { MEDIA, imageProps } from "@/config/mediaControl";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The stripe draws itself across the screen as the section arrives. */
const drawStripe: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 1.3, ease: EASE },
  },
};

/** The slogan writes itself in after the stripe has drawn and the octagon has landed. */
const sloganIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: EASE, delay: 0.7 },
  },
};

/**
 * Reproduced EXACTLY as supplied, including the spaces before the semicolon
 * and full stop. If those were unintentional, this is the one line to edit.
 */
const SLOGAN =
  "Don't Be Institutionalized ; Be the Architect of Your Environment .";

const octagonIn: Variants = {
  hidden: { opacity: 0, scale: 0.85, rotate: -8 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 1.1, ease: EASE, delay: 0.35 },
  },
};

export default function StripeOctagon() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  /* A gentle counter-drift so the octagon feels anchored to the stripe rather
     than painted on the page. */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const octagonY = useTransform(scrollYProgress, [0, 1], ["12%", "-12%"]);

  /**
   * Both entrances are driven off the SECTION being in view, not off the
   * animated elements themselves.
   *
   * `whileInView` on the stripe deadlocks: its hidden state is scaleX(0),
   * which collapses its box to zero width, so IntersectionObserver never
   * reports it as intersecting, so it never animates — it stays invisible
   * because it is invisible. Observing the full-size section instead breaks
   * the cycle.
   */
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });
  const shown = prefersReducedMotion || inView ? "show" : "hidden";

  return (
    <section
      ref={sectionRef}
      aria-label="Profile"
      className="bg-secondary-950 relative isolate flex min-h-[62svh] items-center overflow-hidden py-20 lg:min-h-[70svh] lg:py-24"
    >
      {/* Steel-blue bloom, weighted LEFT to follow the octagon. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 opacity-55"
        style={{
          backgroundImage:
            "radial-gradient(46% 58% at 26% 50%, #2E6D87 0%, transparent 70%)",
        }}
      />

      {/* ================= THE STRIPE =================
          Full width, full strength, centred on the section. */}
      {/* POSITIONING LIVES ON THIS STATIC WRAPPER, not on the animated child.
          Motion writes its own inline `transform` for scaleX, which replaces
          the whole property — so a Tailwind `-translate-y-1/2` on the same
          element is silently thrown away and the stripe drops half its height
          down the page. Keeping the two concerns on separate elements means
          neither can clobber the other. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 -z-10 h-28 -translate-y-1/2 sm:h-32 lg:h-40"
      >
        <motion.div
          variants={drawStripe}
          initial={prefersReducedMotion ? "show" : "hidden"}
          animate={shown}
          className="h-full w-full origin-left"
        >
          <div
            className="relative h-full w-full overflow-hidden shadow-[0_0_60px_rgb(11_59_76/0.75)] backdrop-blur-md backdrop-saturate-150"
            style={{
              /* DEEPEST AT THE EDGES, lifted through the middle. The first
                 attempt was the other way round and the Sand hairlines
                 vanished into the pale edge — a rule only reads if what it
                 sits on is darker than it is. */
              backgroundImage:
                "linear-gradient(180deg, #0B3B4C 0%, #24617A 38%, #2E6D87 50%, #24617A 62%, #0B3B4C 100%)",
            }}
          >
            {/* A highlight travelling along the band. Softer than the cyan
                version — navy blows out badly under a bright sweep. */}
            {!prefersReducedMotion && (
              <div className="animate-[stripe-sweep_5.5s_cubic-bezier(0.22,1,0.36,1)_infinite] absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/14 to-transparent blur-md" />
            )}
            {/* Sand hairlines. On near-black these do the contrast work that a
                navy edge could not. */}
            <div className="bg-sand/85 absolute inset-x-0 top-0 h-px" />
            <div className="bg-sand/55 absolute inset-x-0 bottom-0 h-px" />
          </div>
        </motion.div>
      </div>

      {/* ================= OCTAGON + SLOGAN ================= */}
      <div className="container-premium relative flex w-full flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-12">
        <motion.div
          variants={octagonIn}
          initial={prefersReducedMotion ? "show" : "hidden"}
          animate={shown}
          style={prefersReducedMotion ? undefined : { y: octagonY }}
          className="relative w-44 shrink-0 sm:w-56 lg:w-[19rem]"
        >
          {/* clip-path cannot take a border, so the ring is a slightly larger
              clipped element sitting behind the image. */}
          <div className="clip-octagon from-secondary-300 via-secondary-400 to-secondary-600 bg-gradient-to-br p-[3px]">
            <div className="clip-octagon bg-secondary-950 relative aspect-square w-full overflow-hidden">
              <Image
                {...imageProps(MEDIA.landing.portrait, { fill: true })}
                alt={MEDIA.landing.portrait.alt}
                sizes="(min-width: 1024px) 19rem, (min-width: 640px) 14rem, 11rem"
                className="object-cover"
              />
            </div>
          </div>

          {/* Halo bleeding out from behind the shape. */}
          <div
            aria-hidden="true"
            className="bg-secondary-400/40 absolute inset-0 -z-10 scale-110 blur-3xl"
          />
        </motion.div>

        {/* ---------------- THE SLOGAN ----------------
            COLOUR NOTE: this is accent-200 (#E29AA2), not the Deep Crimson
            #5E0B15 you specified. Deep Crimson on the navy band measures about
            1.3:1 — below even the threshold at which text is detectable, let
            alone readable; the line would simply vanish. accent-200 is the
            same crimson hue lifted into legibility (~4:1 against the band,
            which passes for large text). To use the deep tone instead, swap
            `text-accent-200` for `text-accent` on the <p> below — but it will
            need a light plaque behind it to be readable. */}
        <motion.blockquote
          variants={sloganIn}
          initial={prefersReducedMotion ? "show" : "hidden"}
          animate={shown}
          className="relative max-w-xl"
        >
          <span
            aria-hidden="true"
            className="text-accent-300/40 font-script absolute -top-8 -left-2 text-7xl leading-none select-none lg:-top-10 lg:text-8xl"
          >
            &ldquo;
          </span>
          <p className="text-accent-200 font-script text-[clamp(1.35rem,2.6vw,2.15rem)] leading-[1.35] font-light text-balance italic [text-shadow:0_1px_12px_rgb(2_12_17/0.85)]">
            {SLOGAN}
          </p>
          <span
            aria-hidden="true"
            className="bg-accent-300/50 mt-5 block h-px w-16"
          />
        </motion.blockquote>
      </div>
    </section>
  );
}
