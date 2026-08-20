"use client";

/**
 * ============================================================================
 *  TAROT · DESTINY — section 8
 * ============================================================================
 *
 *  Header first, then two stills at 40/60, then a full-bleed spread. The
 *  closing line sits on the spread itself — ivory serif over a dark wash —
 *  and rises into view as the photograph arrives.
 *
 *  Every image resolves from src/config/mediaControl.ts.
 * ============================================================================
 */

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { MEDIA, imageProps } from "@/config/mediaControl";

const ARGUMENT = {
  eyebrow: "Fortune · Calculation",
  heading: "Symbols, then systems",
  body: "The cards are an old language — archetypes laid in a line. I read them the way I read a model: pattern first, then the numbers underneath. Ancient symbolic wisdom on one side of the table, modern analytical calculation on the other. The interesting work happens where they meet.",
} as const;

const SPREAD_LINE = "A Mirror to the Subconscious.";
const SPREAD_SUB = "Where ancient symbolic art meets modern interpretation.";

export default function TarotDestiny() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="destiny"
      aria-label="Tarot and destiny"
      className="bg-secondary-900 pt-0"
    >
      <div className="container-premium animate-fade-up pt-20 lg:pt-28">
        {/* ---------------- HEADER ---------------- */}
        <header className="mx-auto mb-16 max-w-3xl text-center">
          <div className="flex items-center justify-center gap-4">
            <span aria-hidden="true" className="bg-accent-200 h-px w-10 shrink-0" />
            <span className="text-accent-200 text-[0.65rem] font-semibold tracking-[0.22em] uppercase">
              {ARGUMENT.eyebrow}
            </span>
            <span aria-hidden="true" className="bg-accent-200 h-px w-10 shrink-0" />
          </div>

          <h2 className="text-primary font-display mt-5 text-[clamp(1.85rem,4vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.02em]">
            {ARGUMENT.heading}
          </h2>

          <p className="text-sand-300/90 font-script mt-6 text-[clamp(1.15rem,1.8vw,1.45rem)] leading-[1.65] text-pretty italic">
            {ARGUMENT.body}
          </p>
        </header>

        {/* ---------------- ROW 1 · 40 / 60 ---------------- */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8">
          <figure className="lg:col-span-2">
            <Image
              {...imageProps(MEDIA.tarot.runic)}
              alt={MEDIA.tarot.runic.alt}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-auto w-full rounded-2xl object-cover"
            />
          </figure>

          <figure className="lg:col-span-3">
            <Image
              {...imageProps(MEDIA.tarot.desk)}
              alt={MEDIA.tarot.desk.alt}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="h-auto w-full rounded-2xl object-cover"
            />
          </figure>
        </div>
      </div>

      {/* ---------------- FULL-BLEED SPREAD ---------------- */}
      <figure className="relative mt-24 w-full">
        <Image
          {...imageProps(MEDIA.tarot.spread)}
          alt={MEDIA.tarot.spread.alt}
          sizes="100vw"
          className="h-auto w-full rounded-none object-cover"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        />

        <figcaption className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-12 md:pb-16 lg:pb-20">
          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-center"
          >
            <p className="font-display text-4xl leading-[1.1] font-medium tracking-[-0.02em] text-[#FDFBF7] md:text-6xl">
              {SPREAD_LINE}
            </p>
            <p className="font-script mt-4 text-lg text-[#FDFBF7]/85 italic md:text-2xl">
              {SPREAD_SUB}
            </p>
          </motion.div>
        </figcaption>
      </figure>
    </section>
  );
}
