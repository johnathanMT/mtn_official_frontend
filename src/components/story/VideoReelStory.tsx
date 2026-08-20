"use client";

/**
 * ============================================================================
 *  VIDEO REEL STORY — section 4
 * ============================================================================
 *
 *  A warm beige band that breaks up the dark run above it: a written
 *  reflection on the left (2/5) and a looping reel on the right (3/5).
 *
 *  ABOUT THE VIDEO FORMAT
 *  The source is a .mov. Chrome and Firefox will not decode a QuickTime
 *  container, so pointing <video> straight at the .mov gives a silent black
 *  box on most machines. Cloudinary transcodes on the fly, so we ask it for
 *  two concrete containers and let the browser pick the first it supports:
 *  WebM (smaller where supported) then MP4/H.264 (universal). `f_auto` is not
 *  used here — browsers do not send an Accept header for <video>, so there is
 *  nothing for it to negotiate against.
 *
 *  AUTOPLAY RULES
 *  `muted` + `playsInline` are not stylistic choices — without both, iOS and
 *  every current desktop browser refuses to autoplay. The rest is handled by
 *  useAutoplayReel: start on scroll-into-view, retry once the media can play,
 *  pause on the way out, and offer a tap-to-play control if the browser
 *  refuses outright. The Cloudinary first frame stands in as the poster.
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
 * ------------------------------------------------------------------------ */

const STORY = {
  eyebrow: "Kyoto · Hozugawa",
  heading: "Sixteen kilometres, no steering",
  quote:
    "“The boatmen have poled this gorge for four hundred years. You sit low — low enough to put a hand in the water — and the walls close overhead until all that is left is the knock of the pole against stone and the river deciding where you go next. Somewhere between Kameoka and Arashiyama you stop trying to steer anything at all.”",
  attribution: "Hozugawa River Boat Ride",
} as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const stage: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function VideoReelStory() {
  /* useReducedMotion() returns boolean | null — null while it is still
     resolving on the client. The <video> DOM props only accept boolean, so
     coerce once here rather than at each use site. */
  const reduceMotion = useReducedMotion() ?? false;
  const { videoRef, needsTap, play } = useAutoplayReel(!reduceMotion);

  const publicId = MEDIA.reelStory.video;
  const webm = cloudinaryVideoUrl(publicId, "webm");
  const mp4 = cloudinaryVideoUrl(publicId, "mp4");
  const poster = cloudinaryVideoPoster(publicId);

  return (
    <section
      id="reel"
      aria-label="Hozugawa river"
      className="bg-sand-100 py-20 lg:py-28"
    >
      <motion.div
        variants={stage}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="container-premium grid grid-cols-1 items-center gap-10 lg:grid-cols-5 lg:gap-14"
      >
        {/* ---------------- LEFT · 2/5 ---------------- */}
        <div className="lg:col-span-2">
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <span aria-hidden="true" className="bg-accent h-px w-10 shrink-0" />
            <span className="text-accent text-[0.65rem] font-semibold tracking-[0.22em] uppercase">
              {STORY.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-ink font-display mt-5 text-3xl leading-[1.05] font-medium tracking-[-0.02em] lg:text-4xl"
          >
            {STORY.heading}
          </motion.h2>

          <motion.blockquote variants={fadeUp} className="mt-7">
            <p className="text-ink-muted font-script text-[clamp(1.15rem,1.6vw,1.5rem)] leading-[1.6] text-pretty italic">
              {STORY.quote}
            </p>
            <footer className="text-sand-600 mt-6 flex items-center gap-3 text-xs tracking-[0.16em] uppercase">
              <span aria-hidden="true" className="bg-sand-400 h-px w-8" />
              {STORY.attribution}
            </footer>
          </motion.blockquote>
        </div>

        {/* ---------------- RIGHT · 3/5 ---------------- */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          {/* bg-secondary-900 matters: until the poster arrives the box would
              otherwise be blank beige-on-beige, and a failed poster would leave
              a stark white rectangle. */}
          <div className="bg-secondary-900 shadow-lift relative aspect-[4/5] w-full overflow-hidden rounded-2xl lg:aspect-[4/3]">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              poster={poster}
              /* Reduced-motion visitors get the poster plus controls instead
                 of a clip that starts moving on its own. */
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
              aria-label={MEDIA.reelStory.alt}
            >
              <source src={webm} type="video/webm" />
              <source src={mp4} type="video/mp4" />
              {/* Shown only if neither container can be decoded. */}
              <p className="text-ink p-6">
                Your browser cannot play this video.{" "}
                <a className="text-accent underline" href={mp4}>
                  Download the MP4
                </a>
                .
              </p>
            </video>

            {needsTap && (
              <button
                type="button"
                onClick={play}
                aria-label="Play video"
                className="group absolute inset-0 z-10 grid place-items-center"
              >
                <span className="bg-accent/85 text-primary ring-primary/30 grid h-16 w-16 place-items-center rounded-full ring-1 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                  <svg
                    viewBox="0 0 24 24"
                    className="ml-0.5 h-6 w-6"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}

            {/* A whisper of navy at the base so the reel sits in the palette
                rather than floating as raw footage on beige. */}
            <div
              aria-hidden="true"
              className="from-secondary-950/25 pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t via-transparent to-transparent"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
