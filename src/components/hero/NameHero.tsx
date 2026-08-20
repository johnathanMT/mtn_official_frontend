"use client";

/**
 * ============================================================================
 *  NAME HERO — section 1
 * ============================================================================
 *
 *  Full-screen photographic plate with the name over it. Nothing else — no
 *  octagon, no stripe, no buttons. Those are the section below.
 *
 *  Motion: the plate drifts slower than the page on scroll, each line of the
 *  name rises out of its own clipping mask, and the whole block fades as the
 *  section leaves. All disabled under prefers-reduced-motion.
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
