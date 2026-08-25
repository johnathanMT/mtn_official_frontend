"use client";

/**
 * ============================================================================
 *  NAME HERO — section 1
 * ============================================================================
 *
 *  Full-screen 3D plate. The name sits as a compact overlay in the top-left
 *  so the statues and stupa keep the centre of the frame.
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
  name: ["Myo Thant", "Naing"],
} as const;

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const riseIn: Variants = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 1, ease: EASE } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export default function NameHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      aria-label="Myo Thant Naing"
      className="bg-secondary relative isolate min-h-svh overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="bg-secondary pointer-events-none absolute inset-0 z-0"
      >
        <HeroJizo3D />
      </div>

      {/* A narrow veil only where the type sits — the rest of the canvas
          stays open so the diorama and stupa read. */}
      <div
        aria-hidden="true"
        className="from-secondary-950/70 pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-linear-to-b to-transparent md:w-[min(42%,28rem)]"
      />

      {/* Dissolve the navy 3D plate into the dark-grey profile band. Explicit
          rgba stops — Tailwind `to-transparent` interpolates toward black
          and leaves a dirty seam. Ends on #2A2A2A, the profile canvas. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 sm:h-24 lg:h-28"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgb(11 59 76 / 0) 0%, rgb(11 59 76 / 0.28) 32%, rgb(28 32 34 / 0.72) 64%, rgb(42 42 42 / 1) 100%)",
        }}
      />

      <motion.div
        variants={stage}
        initial="hidden"
        animate="show"
        style={
          prefersReducedMotion
            ? undefined
            : { y: contentY, opacity: contentOpacity }
        }
        className="pointer-events-none absolute top-0 left-0 z-20 w-full max-w-xl pt-24 pr-6 pb-8 pl-6 sm:pt-28 lg:pt-32 lg:pl-12"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <span aria-hidden="true" className="bg-sand h-px w-8 shrink-0" />
          <span className="text-sand text-[0.58rem] font-semibold tracking-[0.22em] uppercase sm:text-[0.65rem] sm:tracking-[0.28em]">
            {COPY.kicker}
          </span>
        </motion.div>

        <h1 className="text-primary font-display mt-4 text-[clamp(2.35rem,5.6vw,4.5rem)] leading-[0.95] font-medium tracking-[-0.03em]">
          {COPY.name.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                variants={riseIn}
                className={`block ${i === 1 ? "text-sand italic" : ""}`}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
      </motion.div>
    </section>
  );
}
