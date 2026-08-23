"use client";

/**
 * ============================================================================
 *  FORTUNE HERO — split-screen media wall
 * ============================================================================
 *
 *  A 2x2 media grid behind a dark scrim, with the chapter title centred over
 *  it. The grid never changes shape between breakpoints — only the spans do:
 *
 *      md and up                      below md
 *      ┌─────────┬─────────┐          ┌───────────────────┐
 *      │         │  still  │          │       video       │
 *      │  video  ├─────────┤          ├─────────┬─────────┤
 *      │         │  still  │          │  still  │  still  │
 *      └─────────┴─────────┘          └─────────┴─────────┘
 *
 *  One `grid-cols-2 grid-rows-2` with two span rules, rather than two separate
 *  layouts — nothing reflows, nothing is duplicated, and the media elements
 *  keep their DOM position so the browser never re-decodes them on resize.
 *
 *  ---------------------------------------------------------------------------
 *  THE .mov PROBLEM — the one change I made to your spec
 *  ---------------------------------------------------------------------------
 *  The URL you gave ends in .mov. QuickTime is a container Chrome and Firefox
 *  will not decode, so `<video src="....mov">` is a black rectangle on most
 *  machines — silently, with no error in the console. This is the third time
 *  this has come up in this project (VideoReelStory and FullSplashReel both
 *  hit it), so the fix here is the same one: ask Cloudinary to transcode into
 *  two concrete containers and let the element pick the first it supports.
 *
 *  `f_auto` does NOT rescue this. Browsers send an Accept header for images
 *  but not for <video>, so there is nothing for Cloudinary to negotiate
 *  against — the format has to be named in the URL.
 *
 *  ---------------------------------------------------------------------------
 *  THE .heic IMAGES — your f_auto,q_auto requirement, kept
 *  ---------------------------------------------------------------------------
 *  Rather than pasting the full URLs, the two stills go through this project's
 *  own Cloudinary loader (next.config.ts -> images.loaderFile). It ALWAYS
 *  emits `f_auto,q_auto` — so HEIC still converts to WebP/AVIF exactly as you
 *  asked — and it additionally appends `w_<width>` per breakpoint, which a
 *  pasted absolute URL cannot do: the loader passes those through untouched,
 *  so every device would download the same full-size file.
 * ============================================================================
 */

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";

import {
  cloudinaryVideoPoster,
  cloudinaryVideoUrl,
} from "@/config/mediaControl";

/* ---------------------------------------------------------------------------
 * MEDIA
 *
 * Cloudinary public IDs, not URLs — the cloud name and the delivery host live
 * in src/config/mediaControl.ts, so they are configured in exactly one place.
 * When this page settles, move these three into MEDIA.fortune there and the
 * component stops carrying content at all.
 * ------------------------------------------------------------------------ */

const MEDIA = {
  video: "v1787477082/mask_oni_horseriding_edouud",

  /* `#…` is how this project's loader receives per-asset transformations —
     it is a plain string, so it survives the Server → Client boundary that a
     loader function would not.

     c_fill + g_auto instead of the default c_limit: each still fills a half-
     screen panel, and g_auto lets Cloudinary pick the crop around the subject
     rather than the geometric centre. Without an `ar_`, c_fill has no target
     shape and quietly behaves like a plain scale. */
  stillTop: "v1787476970/IMG_3327_jfkxuj.heic#c_fill,g_auto,ar_16:10",
  stillBottom:
    "v1787477345/runic_sheet_roll_roseviolent_bsy58k.heic#c_fill,g_auto,ar_16:10",
} as const;

const ALT = {
  /* TODO(myo): describe what is actually in IMG_3327 — I have not seen it, so
     this is a neutral placeholder rather than an invented description. Alt text
     that guesses wrong is worse than alt text that is plainly generic. */
  stillTop: "Fortune chapter still",
  stillBottom: "A runic sheet unrolled across the table",
} as const;

/* ---------------------------------------------------------------------------
 * COPY
 * ------------------------------------------------------------------------ */

const COPY = {
  kicker: "— Chapter 04 —",
  title: "Fortune",
  blurb: "Astrology, timing and reading what the sky is doing.",
  cta: "Discover",
  ctaHref: "#fortune-gallery",
} as const;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.95, ease: EASE } },
};

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function FortuneHero() {
  const reduceMotion = useReducedMotion() ?? false;

  const RENDITION = ["q_auto", "c_limit", "w_1920"] as const;
  const webm = cloudinaryVideoUrl(MEDIA.video, "webm", RENDITION);
  const mp4 = cloudinaryVideoUrl(MEDIA.video, "mp4", RENDITION);
  const poster = cloudinaryVideoPoster(MEDIA.video, 1920);

  return (
    <section
      aria-label="Fortune"
      /* h-svh, not h-screen. `100vh` on iOS Safari is measured with the URL bar
         HIDDEN, so a h-screen hero is taller than the visible viewport and the
         button ends up under the browser chrome until you scroll. `svh` is the
         small-viewport unit — the height with the bar showing — so nothing is
         ever cut off and, unlike `dvh`, it does not resize as the bar hides,
         which would make the whole hero jump mid-scroll.

         min-h keeps it usable on a short laptop window in landscape. */
      className="relative h-svh min-h-[34rem] w-full overflow-hidden bg-black"
    >
      {/* ================= 1 · THE MEDIA GRID ================= */}
      {/* aria-hidden: this is scenery. The heading below carries the meaning,
          and a screen reader announcing three decorative crops before it would
          just be noise. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 grid-rows-2"
      >
        {/* ---------- VIDEO ----------
            Below md: full width, top row. md and up: left half, both rows. */}
        <div className="relative col-span-2 row-span-1 overflow-hidden md:col-span-1 md:row-span-2">
          <video
            className="h-full w-full object-cover"
            poster={poster}
            autoPlay={!reduceMotion}
            loop
            muted
            playsInline
            /* preload="auto" is right HERE and wrong for the reels on the home
               page. This clip is the first thing on screen — the bytes are on
               the critical path either way. The home-page reels are four and
               five sections down, which is why they carry preload="none". */
            preload="auto"
          >
            <source src={webm} type="video/webm" />
            <source src={mp4} type="video/mp4" />
          </video>
        </div>

        {/* ---------- STILL · TOP ---------- */}
        <div className="relative overflow-hidden">
          <Image
            src={MEDIA.stillTop}
            alt={ALT.stillTop}
            fill
            /* Half the viewport on desktop, half on mobile too (the two stills
               sit side by side down there) — so 50vw is correct at every
               breakpoint, which is rare enough to be worth saying out loud. */
            sizes="50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* ---------- STILL · BOTTOM ---------- */}
        <div className="relative overflow-hidden">
          <Image
            src={MEDIA.stillBottom}
            alt={ALT.stillBottom}
            fill
            sizes="50vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* ================= 2 · THE SCRIM ================= */}
      {/* Two layers, and the gradient is DARKEST IN THE MIDDLE.
          My first pass used the reflex `from-black/75 via-black/35 to-black/80`
          — dark at the edges, light through the centre — which is precisely
          backwards: the type sits in the centre, so the one band that needed
          the most cover had the least. On a phone, where the heading lands on
          the seam between the video and the stills, it was the hardest place
          on the page to read. Now the media breathes at the top and bottom
          (~48% and ~55% effective) and the type band sits at ~70%.

          Composite alpha is 1-(1-a1)(1-a2), not a1+a2 — two 35% layers give
          58%, not 70%. Worth remembering before reaching for a third. */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/25" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.30)_0%,rgba(0,0,0,0.62)_38%,rgba(0,0,0,0.62)_66%,rgba(0,0,0,0.42)_100%)]"
      />
      {/* A soft crimson bloom, low and centred — the accent colour appearing as
          light rather than as a block of paint. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(94,11,21,0.45)_0%,transparent_70%)]"
      />

      {/* ================= 3 · THE CONTENT ================= */}
      <motion.div
        variants={stage}
        initial="hidden"
        animate="show"
        /* pt to clear the fixed navbar (h-16, lg:h-20) — without it the kicker
           sits directly under the logo on short screens. */
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-16 text-center lg:pt-20"
      >
        <motion.p
          variants={riseIn}
          className="font-sans text-[0.7rem] font-semibold tracking-[0.4em] text-[#FDFBF7]/75 uppercase sm:text-xs"
        >
          {COPY.kicker}
        </motion.p>

        <motion.h1
          variants={riseIn}
          /* clamp rather than text-7xl/text-8xl: at a fixed 8xl the word runs
             past the edge of a 320px phone. This tops out at the same size on
             a wide screen and stays inside the viewport everywhere below it. */
          className="font-display mt-6 text-[clamp(3.25rem,11vw,8rem)] leading-[0.95] font-medium tracking-[-0.03em] text-[#FDFBF7]"
        >
          {COPY.title}
        </motion.h1>

        <motion.p
          variants={riseIn}
          className="font-script mt-6 max-w-xl text-[clamp(1.05rem,2.2vw,1.35rem)] leading-[1.6] text-pretty text-[#FDFBF7]/85 italic"
        >
          {COPY.blurb}
        </motion.p>

        <motion.div variants={riseIn} className="mt-10">
          <a
            href={COPY.ctaHref}
            className="group relative inline-flex items-center gap-3 rounded-full border border-[#E29AA2]/45 bg-white/5 px-8 py-3.5 font-sans text-[0.7rem] font-semibold tracking-[0.22em] text-[#FDFBF7] uppercase backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#E29AA2]/90 hover:bg-[#5E0B15]/45 hover:shadow-[0_0_0_1px_rgba(226,154,162,0.35),0_0_28px_rgba(94,11,21,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E29AA2]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {COPY.cta}
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
