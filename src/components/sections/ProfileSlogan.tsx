"use client";

/**
 * ============================================================================
 *  PROFILE SLOGAN — 2D type lockup
 * ============================================================================
 *
 *  The 3D world lives in the hero (Jizo + pagoda). This band is type only:
 *  deep maroon, ivory edge, no plate, no perspective, no flip.
 * ============================================================================
 */

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

const LINE_A = "Don’t Be Institutionalized";
const LINE_B = "Be the Architect of Your Environment.";

const MAROON = "#5E0B15";
const IVORY = "#FDFBF7";

const EASE = [0.22, 1, 0.36, 1] as const;

const INK: CSSProperties = {
  color: MAROON,
  WebkitTextStroke: `1.15px ${IVORY}`,
  paintOrder: "stroke fill",
  textShadow: `0 0 18px rgb(253 251 247 / 0.4), 0 8px 28px rgb(0 0 0 / 0.35)`,
};

export default function ProfileSlogan() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <blockquote className="relative mx-auto flex max-w-2xl flex-col items-center py-6 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:size-72"
        style={{
          background:
            "radial-gradient(circle, rgb(253 251 247 / 0.22) 0%, rgb(94 11 21 / 0.18) 42%, rgb(42 42 42 / 0) 70%)",
        }}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.55 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10"
      >
        <p className="font-sans mb-5 text-[0.62rem] font-medium tracking-[0.38em] text-stone-400 uppercase">
          Manifesto
        </p>

        <p className="m-0">
          <span
            className="font-display block text-[clamp(1.45rem,3.4vw,2.35rem)] leading-[1.15] font-medium tracking-[-0.03em] text-balance"
            style={INK}
          >
            {LINE_A}
          </span>

          <span
            aria-hidden="true"
            className="mx-auto my-4 flex items-center justify-center gap-2"
          >
            <span className="h-px w-8 bg-[#FDFBF7]/30" />
            <span className="size-1 rotate-45 bg-[#5E0B15] ring-1 ring-[#FDFBF7]/70" />
            <span className="h-px w-8 bg-[#FDFBF7]/30" />
          </span>

          <span
            className="font-script block text-[clamp(1.2rem,2.8vw,1.85rem)] leading-[1.35] font-light text-balance italic"
            style={INK}
          >
            {LINE_B}
          </span>
        </p>
      </motion.div>
    </blockquote>
  );
}
