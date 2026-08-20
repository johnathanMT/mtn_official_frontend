"use client";

/**
 * ============================================================================
 *  BACK TO HOME — shared chapter chrome
 * ============================================================================
 *
 *  A sand-on-navy pill that sits at the top left of every chapter route.
 *  The nudge on hover (`x: -4`) is the whole interaction — it reads as a
 *  step back toward the origin rather than as a decorative bounce.
 *
 *  Mounted once from `src/app/(chapters)/layout.tsx`, not copied into each
 *  page.tsx. The href is BRAND.href so a future home-route change is a
 *  one-line edit in navigation.ts.
 * ============================================================================
 */

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { BRAND } from "@/config/navigation";

export default function BackToHome() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <Link
      href={BRAND.href}
      aria-label="Back to Home"
      className="focus-visible:outline-none"
    >
      <motion.div
        whileHover={reduceMotion ? undefined : { x: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="bg-sand-50/90 text-secondary ring-sand-300/70 hover:bg-sand-100 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.7rem] font-semibold tracking-[0.18em] uppercase shadow-soft backdrop-blur-md ring-1"
      >
        <span aria-hidden="true">←</span>
        Back to Home
      </motion.div>
    </Link>
  );
}
