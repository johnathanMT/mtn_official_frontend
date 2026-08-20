"use client";

/**
 * ============================================================================
 *  TRAVEL DIARIES — section 7
 * ============================================================================
 *
 *  Two bands, two moods: an ivory Nara/Osaka diary, then a pale slate
 *  Nepali table that drops into a full-width scrapbook. The two stills are
 *  doors onto Instagram — they shake on tap so the click reads as a press.
 *
 *  Every image resolves from src/config/mediaControl.ts. The Instagram href
 *  lives in src/config/navigation.ts.
 * ============================================================================
 */

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { MEDIA, imageProps, type ImageAsset } from "@/config/mediaControl";
import { INSTAGRAM } from "@/config/navigation";

const EASE = [0.22, 1, 0.36, 1] as const;

const IKOMA = {
  eyebrow: "Nara · Osaka",
  heading: "The ridge, then the city",
  body: "Mount Ikoma is a quiet reset — cedar, wind, and the Nara basin opening wide below. Osaka is close enough to fall into the same evening: takoyaki still steaming, a counter of kushikatsu, the city loud and familiar after the mountain's hush.",
} as const;

const NEPAL = {
  eyebrow: "Kathmandu table",
  heading: "Spice, then steam",
  body: "Another kitchen, another register of heat. Cumin, timur, ginger — momo folded at the edge of the table, dal that lingers, the slow comfort of spices that feel both new and already known.",
} as const;

const SHAKE = {
  x: [0, -8, 8, -8, 8, 0],
  transition: { duration: 0.4 },
};

/** Lucide's Instagram glyph — brand icons were removed from lucide-react v1. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function DiaryCopy({
  eyebrow,
  heading,
  body,
  tone = "light",
}: {
  eyebrow: string;
  heading: string;
  body: string;
  tone?: "light" | "sand";
}) {
  const sand = tone === "sand";

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="flex items-center justify-center gap-4">
        <span
          aria-hidden="true"
          className={`h-px w-10 shrink-0 ${sand ? "bg-[#1C2D3A]/30" : "bg-accent"}`}
        />
        <span
          className={`text-[0.65rem] font-semibold tracking-[0.22em] uppercase ${sand ? "text-[#1C2D3A]" : "text-accent"}`}
        >
          {eyebrow}
        </span>
        <span
          aria-hidden="true"
          className={`h-px w-10 shrink-0 ${sand ? "bg-[#1C2D3A]/30" : "bg-accent"}`}
        />
      </div>

      <h2
        className={`font-display mt-5 text-[clamp(1.85rem,4vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.02em] ${sand ? "text-[#1C2D3A]" : "text-secondary"}`}
      >
        {heading}
      </h2>

      <p
        className={`font-script mt-6 text-[clamp(1.15rem,1.8vw,1.45rem)] leading-[1.65] text-pretty italic ${sand ? "text-[#1C2D3A]/80" : "text-secondary/80"}`}
      >
        {body}
      </p>
    </div>
  );
}

function InstagramStill({ asset }: { asset: ImageAsset }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.a
      href={INSTAGRAM.href}
      target="_blank"
      rel="noopener noreferrer"
      whileTap={reduceMotion ? undefined : SHAKE}
      className="group relative block rounded-3xl border border-black/10 bg-black/5 p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] backdrop-blur-md"
    >
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl">
        <Image
          {...imageProps(asset, { fill: true })}
          alt={asset.alt}
          sizes="(min-width: 640px) 42vw, 100vw"
          className="rounded-2xl object-cover transition-transform duration-700 ease-premium group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        <span className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-2 text-[0.62rem] font-semibold tracking-[0.16em] text-white uppercase backdrop-blur-md sm:px-4 sm:text-[0.65rem]">
          <InstagramIcon className="h-3.5 w-3.5 shrink-0" />
          {INSTAGRAM.label}
        </span>
      </div>
      <span className="sr-only"> (opens in a new tab)</span>
    </motion.a>
  );
}

export default function TravelDiaries() {
  return (
    <section id="travel" aria-label="Travel diaries">
      {/* ---------------- NARA · OSAKA ---------------- */}
      <div className="bg-[#FDFBF7] py-24 lg:py-32">
        <div className="container-premium">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <DiaryCopy {...IKOMA} tone="sand" />
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-16 sm:mt-16 sm:grid-cols-2 lg:mt-20 lg:gap-24">
            <InstagramStill asset={MEDIA.travel.ikoma} />
            <InstagramStill asset={MEDIA.travel.osakaCollage} />
          </div>
        </div>
      </div>

      {/* ---------------- NEPALI TABLE ---------------- */}
      <div className="bg-slate-50 pt-20 pb-0 lg:pt-28">
        <div className="container-premium pb-12 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <DiaryCopy {...NEPAL} />
          </motion.div>
        </div>

        <figure className="m-0 block w-full leading-none">
          <Image
            {...imageProps(MEDIA.travel.nepaliScrapbook)}
            alt={MEDIA.travel.nepaliScrapbook.alt}
            sizes="100vw"
            className="block h-auto w-full object-contain"
          />
        </figure>
      </div>
    </section>
  );
}
