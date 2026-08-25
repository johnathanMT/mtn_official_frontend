"use client";

/**
 * ============================================================================
 *  NAME HERO — section 1
 * ============================================================================
 *
 *  Full-screen 3D Jizo plate with the name over it. Nothing else — no
 *  octagon, no stripe, no buttons. Those are the section below.
 *
 *  Motion: the name block fades as the section leaves. The statues themselves
 *  float and track the pointer inside HeroJizo3D. All of that is disabled
 *  under prefers-reduced-motion.
 * ============================================================================
 */

import dynamic from "next/dynamic";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";

const HeroJizo3D = dynamic(() => import("./HeroJizo3D"), {
  ssr: false,
  loading: () => (
    <div className="bg-secondary absolute inset-0" aria-hidden="true" />
  ),
});

const EASE = [0.22, 1, 0.36, 1] as const;

const COPY = {
  kicker: "A Journey of Discovery",
  /* One entry per masked line. */
  name: ["Myo Thant", "Naing"],
} as const;

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

export default function NameHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      aria-label="Myo Thant Naing"
      className="bg-secondary relative isolate flex min-h-svh items-center overflow-hidden"
    >
      {/* ---------- 3D PLATE ----------
          pointer-events-none so the overlay type stays selectable and the
          page keeps scrolling; HeroJizo3D listens to the window pointer. */}
      <div
        aria-hidden="true"
        className="bg-secondary pointer-events-none absolute inset-0 -z-20"
      >
        <HeroJizo3D />
      </div>

      {/* ---------- WASH ----------
          Light on purpose: the canvas is already navy, and a heavy black
          overlay would kill the blue. Just enough at the left and the seams
          so the name and the navbar stay readable. */}
      <div
        aria-hidden="true"
        className="from-secondary-950/55 absolute inset-0 -z-10 bg-linear-to-b via-transparent to-secondary-950/60"
      />
      <div
        aria-hidden="true"
        className="from-secondary-950/45 absolute inset-0 -z-10 bg-linear-to-r via-transparent to-transparent"
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
        className="container-premium relative w-full py-28"
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
