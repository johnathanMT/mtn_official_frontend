"use client";

/**
 * ============================================================================
 *  FULL SPLASH REEL — section 5
 * ============================================================================
 *
 *  Edge-to-edge video, then a crimson reflection set as an inverted pyramid:
 *  flush left, each line shorter than the one above it.
 *
 *  VIDEO FORMAT
 *  The upload is a .mov. Chrome and Firefox will not decode a QuickTime
 *  container, so the raw URL in a <video src> is a black box on most machines.
 *  Cloudinary transcodes on request, so we ask for two concrete containers —
 *  WebM first, MP4/H.264 as the universal fallback — and let the element pick.
 *  `f_auto` is useless here: browsers send no Accept header for <video>.
 *
 *  AUTOPLAY
 *  Handled by useAutoplayReel — see that file for why muted autoplay needs
 *  more than the four attributes. In short: it starts the clip when it scrolls
 *  into view, retries once the media reports it can play, pauses it on the way
 *  out (never before it has started), and exposes a tap-to-play control if the
 *  browser refuses outright, so a blocked reel is visible rather than silent.
 * ============================================================================
 */

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useAutoplayReel } from "@/hooks/useAutoplayReel";
import {
  MEDIA,
  cloudinaryVideoPoster,
  cloudinaryVideoUrl,
} from "@/config/mediaControl";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------------------
 * COPY
 *`
 * The three lines are stored separately so each can carry its own reveal, but
 * they are joined by explicit <br /> in the markup — the shape is deliberate
 * typography, not the accident of whatever width the container happens to be.
 * ------------------------------------------------------------------------ */

const LINES = [
  "Navigating the rapid currents of the Hozugawa River is incredibly thrilling,",
  "as the boat surges with momentum, threading through narrow gaps",
  "between jagged rocks by the narrowest of margins.",
] as const;

/* ---------------------------------------------------------------------------
 * MOTION
 * ------------------------------------------------------------------------ */

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } },
};

const lineIn: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};

const markIn: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  show: { opacity: 1, scaleX: 1, transition: { duration: 1, ease: EASE } },
};

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function FullSplashReel() {
  /* useReducedMotion() is boolean | null — null while it resolves. The <video>
     DOM props only accept boolean, so coerce once. */
  const reduceMotion = useReducedMotion() ?? false;

  const { videoRef, needsTap, play } = useAutoplayReel(!reduceMotion);

  /* w_1920, not the 1280 default: this clip is full-bleed, so on any display
     wider than 1280 the default would be upscaled and visibly soft. c_limit
     still means Cloudinary never enlarges beyond the original master. */
  const RENDITION = ["q_auto", "c_limit", "w_1920"] as const;

  const publicId = MEDIA.splashReel.video;
  const webm = cloudinaryVideoUrl(publicId, "webm", RENDITION);
  const mp4 = cloudinaryVideoUrl(publicId, "mp4", RENDITION);
  const poster = cloudinaryVideoPoster(publicId, 1920);

  return (
    <section
      id="splash-reel"
      aria-label="Hozugawa rapids"
      className="bg-sand-50"
    >
      {/* ================= FULL-BLEED VIDEO ================= */}
      <div
        /* bg-secondary-950 so the band is deep navy, not blank beige, for the
           moment before the poster paints. */
        className="bg-secondary-950 relative h-[70vh] w-full overflow-hidden sm:h-[80vh]"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={poster}
          /* NO autoPlay ATTRIBUTE, AND preload="none".
             The two go together. `autoPlay` makes the browser fetch and
             start the clip the moment the element exists, which overrides
             `preload` entirely — measured, that pulled 254 KB of video on
             first paint for two reels that live four and five sections
             below the fold. useAutoplayReel already starts playback from
             its IntersectionObserver, so the attribute was redundant as
             well as expensive. With both removed: 0 bytes until the reel
             scrolls into view, and it still plays on arrival. */
          loop={!reduceMotion}
          controls={reduceMotion}
          muted
          playsInline
          preload="none"
          aria-label={MEDIA.splashReel.alt}
        >
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
          <p className="text-primary p-6">
            Your browser cannot play this video.{" "}
            <a className="text-accent-200 underline" href={mp4}>
              Download the MP4
            </a>
            .
          </p>
        </video>

        {/* Only appears if the browser refused to autoplay. Better than a
            poster that silently never moves. */}
        {needsTap && (
          <button
            type="button"
            onClick={play}
            aria-label="Play video"
            className="group absolute inset-0 z-10 grid place-items-center"
          >
            <span className="bg-accent/85 text-primary ring-primary/30 grid h-20 w-20 place-items-center rounded-full ring-1 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                className="ml-1 h-7 w-7"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}

        {/* Feathered edges so the clip resolves into the beige above and below
            instead of stopping at a hard seam. Deliberately shallow and part-
            opacity: the first pass used a full-strength 96px fade at each end,
            which washed out roughly a fifth of the footage — the opposite of
            "immersive". This softens the seam without eating the frame. */}
        <div
          aria-hidden="true"
          className="from-sand-50/70 pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b to-transparent"
        />
        <div
          aria-hidden="true"
          className="from-sand-50/70 pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t to-transparent"
        />
      </div>

      {/* ================= THE INVERTED PYRAMID ================= */}
      <motion.div
        variants={stage}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-120px" }}
        className="container-premium py-20 lg:py-28"
      >
        {/* mx-auto centres the BLOCK; text-left keeps every line flush to its
            left edge, so the shortening lines read as a deliberate wedge
            rather than as ragged centring. */}
        <div className="mx-auto max-w-6xl text-left">
          <motion.span
            variants={markIn}
            aria-hidden="true"
            className="bg-accent block h-px w-16 origin-left"
          />

          {/* THE TYPE SIZE IS SET BY THE LONGEST LINE, not by taste.
              At clamp(...,2.6vw,2.3rem) inside max-w-4xl, lines 1 and 2 both
              overflowed and wrapped — they measured exactly the container
              width, which is what wrapping looks like — and a wrapped line
              destroys the wedge the <br /> tags exist to create. Widening the
              measure and easing the cap keeps all three on one line each from
              `lg` up. Below that, 76 characters cannot fit on a phone at any
              readable size, so the lines wrap and the shape relaxes. */}
          <p className="text-accent font-display mt-8 text-[clamp(1rem,2vw,1.7rem)] leading-[1.5] font-medium tracking-[-0.01em]">
            <motion.span variants={lineIn} className="inline-block">
              {LINES[0]}
            </motion.span>
            <br />
            <motion.span variants={lineIn} className="inline-block">
              {LINES[1]}
            </motion.span>
            <br />
            <motion.span variants={lineIn} className="inline-block">
              {LINES[2]}
            </motion.span>
          </p>
        </div>
      </motion.div>
    </section>
  );
}
