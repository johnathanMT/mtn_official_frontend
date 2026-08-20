"use client";

/**
 * ============================================================================
 *  PILLAR GALLERY — six vertical cards, accordion on hover
 * ============================================================================
 *
 *  DESKTOP  a flex row of six tall pillars. The active card grows its
 *           flex-grow, lifts on -translate-y, and swaps its rotated spine
 *           label for a horizontal title + subtitle.
 *
 *  MOBILE   six pillars at 390px would be 65px each — unreadable. Below `lg`
 *           this becomes a snap-scrolling rail of 68vw cards with their text
 *           always visible, which is the honest mobile answer to an accordion.
 *
 *  WIDTH IS A CSS TRANSITION, NOT A FRAMER-MOTION ANIMATION. Animating
 *  flex-grow through Motion means a React render per frame for six siblings;
 *  the browser can interpolate it on its own compositor for free. Motion is
 *  used where it earns its keep — the staggered scroll-in, and the text
 *  cross-fade.
 *
 *  Content comes from MEDIA.pillars. Keys come from `id`, never `src` — two
 *  entries pointing at the same image would otherwise collapse into one card.
 * ============================================================================
 */

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { getPillars, imageProps, type PillarItem } from "@/config/mediaControl";

const EASE = [0.22, 1, 0.36, 1] as const;

const rail: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const pillar: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

/* ---------------------------------------------------------------------------
 * ONE PILLAR
 * ------------------------------------------------------------------------ */

function Pillar({
  item,
  index,
  isActive,
  onActivate,
  onClear,
}: {
  item: PillarItem;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onClear: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      variants={pillar}
      onMouseEnter={onActivate}
      onMouseLeave={onClear}
      onFocus={onActivate}
      onBlur={onClear}
      onClick={onActivate}
      tabIndex={0}
      aria-label={`${item.title} — ${item.subtitle}`}
      style={{ flexGrow: isActive ? 2.4 : 1 }}
      className={[
        /* rounded on the mobile rail, square and flush on the desktop wall —
           "seamless" means the pillars must actually touch. */
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-sm lg:rounded-none",
        "focus-visible:ring-electric focus-visible:ring-2 focus-visible:outline-none",
        /* Mobile: fixed-width snap card. Desktop: flex accordion. */
        "h-[62vh] w-[68vw] snap-center sm:w-[46vw] lg:h-[78vh] lg:w-auto lg:basis-0",
        "transition-[flex-grow,transform,box-shadow] duration-700 ease-out",
        isActive && !prefersReducedMotion
          ? "lg:-translate-y-3 lg:shadow-2xl"
          : "",
      ].join(" ")}
    >
      <Image
        {...imageProps(item, {
          fill: true,
          /* A tall delivery crop with smart gravity. The card is narrower than
             2:3 when collapsed, so CSS still crops horizontally — but g_auto
             has already centred the frame on the subject, so what survives
             that second crop is the part worth keeping. */
          transformations: ["c_fill,g_auto,ar_2:3"],
        })}
        alt={item.alt}
        sizes="(min-width: 1024px) 34vw, (min-width: 640px) 46vw, 68vw"
        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
      />

      {/* Navy wash — deep when collapsed so the rail reads as one dark object,
          lifting as a card opens to let the photograph speak. */}
      <div
        aria-hidden="true"
        className={`from-secondary-950 via-secondary-950/35 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent transition-opacity duration-700 ${
          isActive ? "opacity-60" : "opacity-95"
        }`}
      />

      {/* Electric edge, only while open. */}
      <div
        aria-hidden="true"
        className={`bg-electric pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-left transition-transform duration-700 ease-out ${
          isActive ? "scale-x-100" : "scale-x-0"
        }`}
      />

      {/* ---------- COLLAPSED SPINE LABEL (desktop only) ----------
          The rotated title is what makes a narrow pillar readable. It only
          exists on desktop; on mobile the card is wide enough for real text. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 hidden items-end justify-center p-5 transition-opacity duration-500 lg:flex ${
          isActive ? "lg:opacity-0" : "lg:opacity-100"
        }`}
      >
        <span className="text-primary/90 font-display text-xl whitespace-nowrap [writing-mode:vertical-rl] [text-orientation:mixed]">
          {item.title}
        </span>
      </div>

      {/* ---------- OPEN LABEL ----------
          Always visible on mobile; on desktop it cross-fades in as the card
          opens. Both class strings are written out in full — Tailwind only
          emits classes it can see literally in the source. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 p-5 transition-all duration-500 ease-out lg:p-7 ${
          isActive
            ? "translate-y-0 opacity-100"
            : "translate-y-0 opacity-100 lg:translate-y-4 lg:opacity-0"
        }`}
      >
        <span className="text-electric-glow font-mono text-[0.65rem] tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-primary font-display mt-1 text-2xl leading-tight lg:text-3xl">
          {item.title}
        </h3>
        <p className="text-sand mt-1 text-sm tracking-wide">{item.subtitle}</p>
      </div>
    </motion.article>
  );
}

/* ---------------------------------------------------------------------------
 * SECTION
 * ------------------------------------------------------------------------ */

export default function PillarGallery() {
  const items = getPillars();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section
      id="pillars"
      aria-label="Places"
      className="bg-secondary-950 py-20 lg:py-28"
    >
      <div className="container-premium">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="bg-electric h-px w-10" />
          <span className="text-electric-glow text-xs font-semibold tracking-[0.2em] uppercase">
            Places
          </span>
        </div>
        <h2 className="text-primary font-display mt-4 text-3xl lg:text-5xl">
          Six frames, <span className="text-sand italic">one road</span>
        </h2>
      </div>

      <motion.div
        variants={rail}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className={[
          "mt-12 flex gap-3 lg:mt-16 lg:gap-0",
          /* Mobile: snap rail with edge padding. Desktop: flush accordion. */
          "snap-x snap-mandatory overflow-x-auto px-6 pb-4",
          "lg:snap-none lg:overflow-visible lg:px-0 lg:pb-0",
        ].join(" ")}
      >
        {items.map((item, i) => (
          <Pillar
            key={item.id}
            item={item}
            index={i}
            isActive={activeId === item.id}
            onActivate={() => setActiveId(item.id)}
            onClear={() => setActiveId(null)}
          />
        ))}
      </motion.div>
    </section>
  );
}
