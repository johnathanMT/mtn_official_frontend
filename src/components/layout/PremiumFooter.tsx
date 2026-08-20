"use client";

/**
 * ============================================================================
 *  PREMIUM FOOTER — the grounding element
 * ============================================================================
 *
 *  An almost-black slab with a faint crimson tint that closes the page: the
 *  signature line at the top, a three-column grid beneath it, then a hairline
 *  and the copyright.
 *
 *  TWO DECISIONS WORTH KNOWING ABOUT
 *
 *  1. IVORY ON NEAR-BLACK, NOT CRIMSON ON CRIMSON.
 *     The slab is #0a0000 → #1a0408 — black with a whisper of Deep Crimson
 *     rather than the full #5E0B15 field, which overpowered the page. Ivory /
 *     Sand (#FDFBF7) is the ink here — it is what actually contrasts. Hover
 *     stays in the sand family rather than warming toward a pink that would
 *     vanish.
 *
 *  2. THE CHAPTER LINKS ARE NOT TYPED OUT.
 *     They come from src/config/navigation.ts, the same source the navbar
 *     reads. Adding a fifth chapter should never mean remembering to edit
 *     the footer too.
 *
 *  Rendered as a sibling of <main>, not a child — see the note in page.tsx.
 * ============================================================================
 */

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";

import {
  BRAND,
  NAV_LINKS,
  SOCIAL_LINKS,
  CONTACT_EMAIL,
} from "@/config/navigation";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------------------
 * COPY
 * ------------------------------------------------------------------------ */

const SLOGAN = "Don't Be Institutionalized;";
const SLOGAN_SECOND = "Be the Architect of Your Environment.";

const BRAND_LINE =
  "Exploring the intersections of technology, art, and destiny.";

/* The year is a literal, not new Date().getFullYear(). A date read at render
   time differs between the server prerender and the client hydration for
   anyone whose clock is on the other side of midnight UTC, and React logs a
   hydration mismatch for it. A copyright year is a once-a-year edit. */
const COPYRIGHT_YEAR = 2026;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};

const ruleIn: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  show: { opacity: 1, scaleX: 1, transition: { duration: 1.1, ease: EASE } },
};

/* ---------------------------------------------------------------------------
 * SMALL PARTS
 * ------------------------------------------------------------------------ */

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sans text-[0.65rem] font-semibold tracking-[0.24em] text-[#FDFBF7]/70 uppercase">
      {children}
    </h2>
  );
}

/**
 * The hover treatment shared by every link in the grid: nudge right, lift
 * toward full ivory. `inline-block` is required — a transform has no effect
 * on an inline box, so without it `translate-x-2` silently does nothing.
 */
const LINK_CLASS =
  "inline-block text-[0.95rem] text-[#FDFBF7]/85 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-2 hover:text-[#FDFBF7] focus-visible:translate-x-2 focus-visible:text-[#FDFBF7] motion-reduce:transition-none motion-reduce:hover:translate-x-0";

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function PremiumFooter() {
  const reduceMotion = useReducedMotion() ?? false;

  /* globals.css sets `scroll-behavior: auto` under prefers-reduced-motion,
     but an explicit behavior:"smooth" here would override that CSS — so the
     preference has to be honoured in JS as well. */
  const backToTop = () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

  return (
    <footer className="relative overflow-hidden bg-linear-to-b from-[#0a0000] to-[#1a0408] text-[#FDFBF7]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-radial from-accent-900/50 via-accent-800/25 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -bottom-40 h-96 w-96 rounded-full bg-radial from-accent-900/40 to-transparent blur-3xl"
      />

      <motion.div
        variants={stage}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="relative px-6 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          {/* ================= 1 · THE CLOSING STATEMENT ================= */}
          <motion.div variants={riseIn}>
            <span
              aria-hidden="true"
              className="mb-8 block h-px w-14 bg-[#FDFBF7]/60"
            />

            <p className="font-script max-w-4xl text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.15] font-light text-[#FDFBF7] italic">
              {SLOGAN}
              <br />
              <span className="text-sand-200">{SLOGAN_SECOND}</span>
            </p>
          </motion.div>

          {/* ================= 2 · THE GRID ================= */}
          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-12 lg:gap-10">
            <motion.div variants={riseIn} className="lg:col-span-5">
              <Link
                href={BRAND.href}
                className="group inline-block"
                aria-label={`${BRAND.name} — home`}
              >
                <span className="font-display block text-2xl font-semibold tracking-[-0.02em] text-[#FDFBF7] sm:text-3xl">
                  Myo{" "}
                  <span className="font-light text-sand-200 italic">Thant</span>{" "}
                  Naing
                </span>
                <span
                  aria-hidden="true"
                  className="mt-3 block h-px w-0 bg-[#FDFBF7] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-24"
                />
              </Link>

              <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-[#FDFBF7]/80">
                {BRAND_LINE}
              </p>
            </motion.div>

            <motion.nav
              variants={riseIn}
              aria-label="Chapters"
              className="lg:col-span-3"
            >
              <ColumnHeading>Chapters</ColumnHeading>
              <ul className="mt-6 space-y-4">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>

            <motion.div variants={riseIn} className="lg:col-span-4">
              <ColumnHeading>Connect</ColumnHeading>
              <ul className="mt-6 space-y-4">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={LINK_CLASS}
                    >
                      {social.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}

                <li className="pt-2">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="group inline-block text-[0.95rem] text-[#FDFBF7]/85 transition-colors duration-300 hover:text-[#FDFBF7] focus-visible:text-[#FDFBF7]"
                  >
                    <span className="underline-offset-[6px] decoration-[#FDFBF7]/40 group-hover:underline">
                      {CONTACT_EMAIL}
                    </span>
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* ================= 3 · HAIRLINE + COPYRIGHT ================= */}
          <motion.div
            variants={ruleIn}
            aria-hidden="true"
            className="mt-16 h-px w-full origin-left bg-[#FDFBF7]/20 lg:mt-20"
          />

          <motion.div
            variants={riseIn}
            className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-xs tracking-[0.04em] text-[#FDFBF7]/65">
              © {COPYRIGHT_YEAR} {BRAND.name}. All rights reserved.
            </p>

            <button
              type="button"
              onClick={backToTop}
              className="group inline-flex items-center gap-2.5 self-start rounded-full px-4 py-2 text-[0.7rem] font-semibold tracking-[0.18em] text-[#FDFBF7]/85 uppercase ring-1 ring-[#FDFBF7]/30 transition-colors duration-300 hover:text-[#FDFBF7] hover:ring-[#FDFBF7]/60 focus-visible:text-[#FDFBF7] sm:self-auto"
            >
              Back to Top
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </footer>
  );
}
