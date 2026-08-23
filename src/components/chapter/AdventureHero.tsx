"use client";

/**
 * ============================================================================
 *  ADVENTURE HERO — cinema viewfinder over a video plate
 * ============================================================================
 *
 *  Replaces the shared <ChapterHero /> on /adventure only. Everything the old
 *  hero showed is still here — eyebrow, title, blurb — just centred and sitting
 *  above the camera furniture instead of bottom-left over a still.
 *
 *  ---------------------------------------------------------------------------
 *  THE .mov PROBLEM, FOR THE FOURTH TIME IN THIS PROJECT
 *  ---------------------------------------------------------------------------
 *  The URL you gave ends in .mov. QuickTime is a container Chrome and Firefox
 *  will not decode, so `<video src="....mov">` is a black rectangle on most
 *  machines — silently, with no console error. VideoReelStory, FullSplashReel
 *  and FortuneHero all hit this. Same fix: ask Cloudinary to transcode into two
 *  concrete containers and let the element pick the first it supports.
 *
 *  `f_auto` does NOT rescue this. Browsers send an Accept header for images but
 *  not for <video>, so there is nothing for Cloudinary to negotiate against —
 *  the format has to be named in the URL.
 *
 *  ---------------------------------------------------------------------------
 *  NO NEGATIVE z-index, THOUGH THE BRIEF ASKED FOR -z-30
 *  ---------------------------------------------------------------------------
 *  A negative z-index child only stays inside its parent if the parent creates
 *  a STACKING CONTEXT. `position: relative` with `z-index: auto` does not. I
 *  built the two-element test case for the footer earlier in this project and
 *  sampled the pixels: without `isolation: isolate` the -z child paints BEHIND
 *  the parent's own background and is never seen. This section has a `bg-black`
 *  fallback, so it would have hit exactly that.
 *
 *  `isolate` would fix it, but plain DOM order does the same job with nothing
 *  to remember: video first, scrims next, viewfinder at z-10, type at z-20.
 *  Painting order is already what we want, and there is no trap left for
 *  whoever edits this next.
 *
 *  ---------------------------------------------------------------------------
 *  THE VIEWFINDER IS aria-hidden, AND THAT IS NOT LAZINESS
 *  ---------------------------------------------------------------------------
 *  "REC", "ISO 800", "5600K", the timecode — none of it is true. It is set
 *  dressing. Left exposed, a screen reader would read a fabricated camera
 *  status out as though it were information about the page. The whole overlay
 *  is hidden from the accessibility tree; the heading underneath carries the
 *  meaning.
 *
 *  The timecode is a literal, not a live clock. `new Date()` at render time
 *  differs between the server prerender and the client hydration and React logs
 *  a mismatch for it — the same trap as the footer's copyright year. If you
 *  want it ticking, drive it from a useEffect after mount so the server never
 *  renders a value at all.
 *
 *  ---------------------------------------------------------------------------
 *  THE FILMSTRIP LOOPS ON EXACT ARITHMETIC, NOT ON LUCK
 *  ---------------------------------------------------------------------------
 *  A marquee is seamless only if translating by half the track lands on a whole
 *  number of repeats. The obvious build — holes in a flex row with `gap-6` —
 *  does NOT: 80 holes at 16px with 79 gaps at 24px is 3176px, and half of that
 *  is 1588, which is not a multiple of the 40px pitch. The loop would jump a
 *  fraction of a hole every cycle.
 *
 *  So the spacing lives INSIDE each cell rather than between cells: every cell
 *  is a fixed width with the hole centred in it, no gap anywhere. The track is
 *  then exactly `cells x cellWidth`, half of it is exactly `cells/2` cells, and
 *  -50% lands on a repeat at every breakpoint — including when the cell width
 *  changes at md, because it changes uniformly.
 * ============================================================================
 */

import { motion, useReducedMotion, type Variants } from "motion/react";

import {
  cloudinaryVideoPoster,
  cloudinaryVideoUrl,
} from "@/config/mediaControl";
import { chapterEyebrow, getChapter } from "@/config/navigation";

/* ---------------------------------------------------------------------------
 * MEDIA
 *
 * Cloudinary public ID, not a URL — the cloud name and delivery host live in
 * src/config/mediaControl.ts, configured in exactly one place.
 *
 * Note the dot inside the id. Cloudinary treats only the LAST dot as the
 * format separator, so `far_Mt.fuji_yl2jj2` is the public id and `.webm` /
 * `.mp4` are appended cleanly. Nothing needs escaping.
 * ------------------------------------------------------------------------ */

const VIDEO_ID = "v1787505505/far_Mt.fuji_yl2jj2";

/* ---------------------------------------------------------------------------
 * COPY
 *
 * The chapter number is NOT typed here. It is derived from NAV_LINKS order by
 * chapterEyebrow(), the same source the mobile nav numbers from — this hero
 * used to say "Chapter 01" while the nav said 02. The blurb comes from the
 * same config the old ChapterHero read, so the page copy is unchanged.
 *
 * English only, matching the other chapter heroes. `chapterEyebrow` also
 * returns `.my` ("အခန်း ၀၂") if you later want Adventure bilingual the way
 * Fortune is.
 * ------------------------------------------------------------------------ */

const CHAPTER = getChapter("/adventure")!;

const COPY = {
  eyebrow: chapterEyebrow("/adventure").en,
  title: "Adventure",
  blurb: CHAPTER.blurb,
} as const;

/* Fake camera telemetry. One object so it reads as the prop it is. */
const TELEMETRY = {
  iso: "ISO 800",
  kelvin: "5600K",
  fps: "24 FPS",
  lens: "35mm  T1.9",
  timecode: "01:23:45:12",
} as const;

/* ---------------------------------------------------------------------------
 * FILMSTRIP GEOMETRY — see the arithmetic note in the header.
 *
 * Even count, because the loop translates by exactly half the track. Each cell
 * is `w-9 md:w-12` with the perforation centred inside, so the pitch is the
 * cell width and the track is a whole number of pitches either way.
 *
 * 80 cells means each half is 40 cells: 1440px at the base size, 1920px from
 * md up. That is wider than the viewport at every breakpoint this site
 * targets, so there is never a visible end of strip.
 * ------------------------------------------------------------------------ */

const PERFORATIONS = 80;

/* ---------------------------------------------------------------------------
 * SCRIM — see the note at the layers themselves for how these were arrived at.
 *
 * `centre` is the one that carries readability; `vignette` is the lens look.
 * If you want more of the mountain, `centre`'s first stop is the number to
 * move — but it is at 0.46 because 0.40 measured 2.3:1 against a white frame,
 * so there is not much room below it.
 * ------------------------------------------------------------------------ */

const SCRIM = {
  flat: "bg-black/40",
  centre:
    "bg-[radial-gradient(58%_52%_at_50%_50%,rgba(0,0,0,0.46)_0%,rgba(0,0,0,0.26)_58%,transparent_86%)]",
  vignette:
    "bg-[radial-gradient(78%_78%_at_50%_50%,transparent_0%,rgba(0,0,0,0.18)_62%,rgba(0,0,0,0.50)_100%)]",
} as const;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.35 } },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function AdventureHero() {
  const reduceMotion = useReducedMotion() ?? false;

  const RENDITION = ["q_auto", "c_limit", "w_1920"] as const;
  const webm = cloudinaryVideoUrl(VIDEO_ID, "webm", RENDITION);
  const mp4 = cloudinaryVideoUrl(VIDEO_ID, "mp4", RENDITION);
  const poster = cloudinaryVideoPoster(VIDEO_ID, 1920);

  return (
    <section
      aria-label={COPY.title}
      /* svh, not vh: iOS Safari measures 100vh with the URL bar HIDDEN, so a
         vh-sized hero is taller than the visible viewport and the bottom of
         the frame — here, the filmstrip — sits under the browser chrome until
         you scroll. bg-black is the fallback while the video decodes. */
      className="relative flex min-h-[80svh] w-full items-center justify-center overflow-hidden bg-black"
    >
      {/* ================= 1 · THE PLATE ================= */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        poster={poster}
        autoPlay={!reduceMotion}
        loop
        muted
        playsInline
        /* preload="auto" is right HERE and wrong for the home-page reels.
           This is the first thing on the route — the bytes are on the critical
           path either way. The reels are several sections down and carry
           preload="none". */
        preload="auto"
      >
        <source src={webm} type="video/webm" />
        <source src={mp4} type="video/mp4" />
      </video>

      {/* ================= 2 · THE SCRIM ================= */}
      {/* THREE LAYERS, AND THE MIDDLE ONE EXISTS BECAUSE I GOT THIS WRONG THE
          FIRST TIME. My first pass was a flat 40% plus a lens vignette that
          darkened the EDGES and left the centre clear — on the reasoning that a
          vignette is what a real lens does. It is, but the type is in the
          centre. Rendered against a blown-out white plate (the brightest a
          video frame can be) and sampled at the type's own position:

              flat 40% + edge vignette      bg rgb(146,146,146)   2.3-2.8 : 1
              floors: 4.5 for the eyebrow and blurb, 3.0 for the h1

          Every line failed. Working back from 4.5:1 for ivory at 80% opacity,
          the surface under the type has to sit at or below about rgb(88) —
          which over a white frame means roughly 0.66 combined coverage, not
          0.40. SCRIM.centre supplies the difference exactly where the words
          are, and the vignette is eased from 0.65 to 0.50 at the corners so
          the two do not stack into a black frame.

          This is the same lesson as the Fortune hero, which had the identical
          bug for the identical reason: the reflex is to darken the edges. */}
      <div aria-hidden="true" className={`absolute inset-0 ${SCRIM.flat}`} />
      <div aria-hidden="true" className={`absolute inset-0 ${SCRIM.centre}`} />
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${SCRIM.vignette}`}
      />

      {/* ================= 3 · THE VIEWFINDER ================= */}
      {/* aria-hidden and pointer-events-none: fabricated camera status must not
          reach the accessibility tree, and none of it is interactive. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 font-mono text-[0.6rem] tracking-[0.18em] text-white/80 uppercase sm:text-[0.68rem]"
      >
        {/* ---------- corner brackets ---------- */}
        <span className="absolute top-5 left-5 h-7 w-7 border-t border-l border-white/70 md:top-8 md:left-8 md:h-11 md:w-11" />
        <span className="absolute top-5 right-5 h-7 w-7 border-t border-r border-white/70 md:top-8 md:right-8 md:h-11 md:w-11" />
        <span className="absolute bottom-14 left-5 h-7 w-7 border-b border-l border-white/70 md:bottom-20 md:left-8 md:h-11 md:w-11" />
        <span className="absolute right-5 bottom-14 h-7 w-7 border-r border-b border-white/70 md:right-8 md:bottom-20 md:h-11 md:w-11" />

        {/* ---------- centre crosshair ----------
            Two hairlines rather than a "+" glyph: a typed plus sits on the
            text baseline and is optically low, and its weight changes with the
            font. These are exactly 1px and exactly centred. */}
        <span className="absolute top-1/2 left-1/2 h-px w-7 -translate-x-1/2 -translate-y-1/2 bg-white opacity-30 md:w-10" />
        <span className="absolute top-1/2 left-1/2 h-7 w-px -translate-x-1/2 -translate-y-1/2 bg-white opacity-30 md:h-10" />

        {/* ---------- REC ---------- */}
        <div className="absolute top-6 left-16 flex items-center gap-2 md:top-10 md:left-24">
          {/* animate-pulse is a CSS animation, so the reduced-motion block in
              globals.css already clamps it to 0.01ms — no JS gate needed. The
              ring is the glow: a box-shadow reads as emitted light on a dark
              plate where a flat red dot reads as a sticker. */}
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600 shadow-[0_0_8px_2px_rgba(220,38,38,0.75)]" />
          <span>Rec</span>
        </div>

        {/* ---------- top-right telemetry ---------- */}
        <div className="absolute top-6 right-16 flex items-center gap-3 md:top-10 md:right-24 md:gap-5">
          <span>{TELEMETRY.iso}</span>
          <span className="text-white/45">·</span>
          <span>{TELEMETRY.kelvin}</span>
        </div>

        {/* ---------- bottom telemetry ----------
            bottom-24 clears the filmstrip (h-8, md:h-10) with room to spare;
            the corner brackets are lifted to match so the frame still reads as
            a rectangle rather than running under the strip. */}
        <div className="absolute bottom-24 left-5 flex items-center gap-3 md:bottom-32 md:left-8 md:gap-5">
          <span>{TELEMETRY.fps}</span>
          <span className="hidden text-white/45 sm:inline">·</span>
          <span className="hidden sm:inline">{TELEMETRY.lens}</span>
        </div>
        <div className="absolute right-5 bottom-24 md:right-8 md:bottom-32">
          <span className="tabular-nums">{TELEMETRY.timecode}</span>
        </div>
      </div>

      {/* ================= 4 · THE TYPE ================= */}
      <motion.div
        variants={stage}
        initial="hidden"
        animate="show"
        /* pt clears the fixed navbar (h-16, lg:h-20); pb clears the filmstrip
           and the bottom telemetry.

           THE CROSSHAIR PASSES BEHIND THIS COLUMN, AND THAT IS THE DESIGN.
           I tried to lift the column so the reticle sat in the gap between the
           title and the blurb, and measured why that cannot work: the gap is
           mt-6, about 17px of clear space at 1440, and the crosshair is 40px
           tall. There is no amount of padding that fits it — lifting the column
           just trades a 24.6px overlap with the title for a 30.6px overlap with
           the blurb.

           So it stays at frame centre, which is the only place a centre marker
           belongs, and the z-order does the work: the reticle is z-10 and this
           column is z-20, so the type paints over it and the arms show only in
           the clear frame either side. That is what a real viewfinder does —
           the reticle is over the image and under the UI. */
        className="relative z-20 flex w-full flex-col items-center px-6 pt-20 pb-32 text-center lg:pt-24 lg:pb-40"
      >
        <motion.div variants={riseIn} className="flex items-center gap-4">
          <span aria-hidden="true" className="bg-accent h-px w-8 sm:w-10" />
          {/* /90, not the /80 the other chapter heroes use for this label.
              It sits ABOVE the centre of the scrim's radial, where the cover
              has already started to fall away — measured 4.33:1 at /80 against
              a white plate, just under the 4.5 floor, and 4.99:1 at /90. A 10%
              opacity change on a 12px label is invisible; failing AA is not. */}
          <span className="text-primary/90 text-[0.62rem] font-semibold tracking-[0.16em] uppercase sm:text-xs sm:tracking-[0.22em]">
            {COPY.eyebrow}
          </span>
          <span aria-hidden="true" className="bg-accent h-px w-8 sm:w-10" />
        </motion.div>

        <motion.h1
          variants={riseIn}
          /* clamp rather than a fixed 8xl: at a fixed size the word overruns a
             320px phone. Tops out at the same size on a wide screen. */
          className="text-primary font-display mt-6 text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.95] font-medium tracking-[-0.03em]"
        >
          {COPY.title}
        </motion.h1>

        <motion.p
          variants={riseIn}
          className="text-primary/80 mt-6 max-w-md text-base text-balance sm:text-lg"
        >
          {COPY.blurb}
        </motion.p>
      </motion.div>

      {/* ================= 5 · THE FILMSTRIP ================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 overflow-hidden border-t border-white/10 bg-black/60 backdrop-blur-[2px] md:h-10"
      >
        <motion.div
          className="flex h-full w-max items-center"
          /* whileInView rather than animate, with once:false, so the loop stops
             when the hero scrolls away instead of holding a compositor
             animation alive for the life of the page. -50% is exactly half the
             track, which is a whole number of cells — see the header. */
          whileInView={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          {Array.from({ length: PERFORATIONS }).map((_, i) => (
            <span
              key={i}
              className="flex w-9 shrink-0 items-center justify-center md:w-12"
            >
              {/* The perforation. Semi-transparent white with an inset ring, so
                  it reads as a hole punched through film rather than a painted
                  rectangle — the ring is the cut edge catching light. */}
              <span className="h-2.5 w-4 rounded-[2px] bg-white/15 ring-1 ring-white/10 ring-inset md:h-3 md:w-5" />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
