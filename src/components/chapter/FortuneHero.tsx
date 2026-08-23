"use client";

/**
 * ============================================================================
 *  FORTUNE HERO — split-screen media wall, bilingual
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
 *  THE BILINGUAL RULES — the same four in all three Fortune components
 *  ---------------------------------------------------------------------------
 *  1 · lang="my" ON EVERY BURMESE NODE. Not decoration. It is what tells the
 *      browser to reach for the Myanmar font stack, what stops a screen reader
 *      pronouncing Burmese with English phonetics, and what lets a crawler read
 *      the page as bilingual rather than as English with noise in it.
 *
 *  2 · tracking-normal, ALWAYS. globals.css puts `letter-spacing: -0.02em` on
 *      every h1–h4, and this file's own labels carry tracking up to 0.4em.
 *      Latin tolerates that; Myanmar does not. Burmese builds a syllable from a
 *      base consonant plus marks that sit above, below and beside it, and
 *      letter-spacing is inserted BETWEEN those marks — positive tracking tears
 *      the cluster apart, negative tracking overlaps it. Every Burmese node
 *      below resets it. `uppercase` is likewise a no-op on Myanmar, so the
 *      Burmese labels drop it rather than inheriting it.
 *
 *  3 · NO ITALIC ON BURMESE. The brief suggested italicising the translation.
 *      Myanmar Text, Padauk and Noto Sans Myanmar ship no italic face, so the
 *      browser SYNTHESISES one by shearing the glyphs — and a sheared stacked
 *      script reads as a rendering fault rather than as emphasis. The
 *      translations are distinguished by colour, size and the font change
 *      instead, which is what the request was actually after.
 *
 *  4 · MUCH MORE LEADING. Those stacked marks occupy real vertical space.
 *      Latin body here runs at 1.6; the Burmese under it runs at 1.95, and the
 *      Burmese title at 1.6 where the English title runs at 0.95. Tighten them
 *      and the upper marks clip against the line above.
 *
 *  The font itself comes from `font-myanmar`, a --font-myanmar token added to
 *  the @theme block in globals.css. It is a system stack, not a webfont — the
 *  reasoning is written out at the token.
 *
 *  ---------------------------------------------------------------------------
 *  THE .mov PROBLEM — the one change I made to your original spec
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

     c_fill + g_auto instead of the default c_limit: the still fills a half-
     screen panel, and g_auto lets Cloudinary pick the crop around the subject
     rather than the geometric centre. Without an `ar_`, c_fill has no target
     shape and quietly behaves like a plain scale. */
  stillTop: "v1787476970/IMG_3327_jfkxuj.heic#c_fill,g_auto,ar_16:10",

  /* ---------------------------------------------------------------------
     NO `#…` SUFFIX ON THIS ONE, AND THAT IS THE WHOLE POINT OF THE CHANGE.
     ---------------------------------------------------------------------
     The old asset carried `#c_fill,g_auto,ar_16:10`, which crops on
     Cloudinary's side BEFORE the file reaches the browser. Then
     `object-cover` crops it a second time in CSS. Two crops compound, and
     the second one has no idea what the first threw away — if your subject
     sits anywhere but dead centre, `ar_16:10` can already have taken it off
     before `object-position` gets a vote.

     That would have been a fair trade if 16:10 matched the panel. It does
     not. I measured the rendered panel at five viewports:

         viewport        still panel        panel aspect
         320 x 720       160 x 360          0.444
         390 x 844       195 x 422          0.462     ← phones
         768 x 1024      384 x 512          0.750
         1024 x 768      512 x 384          1.333
         1440 x  900     720 x 450          1.600     ← laptops

     The panel's aspect ratio is always the VIEWPORT's aspect ratio — below
     md the stills are half the width and half the height, above md they are
     half of each as well. So it swings 3.6x between a phone held upright and
     a laptop, and `ar_16:10` is correct at exactly one of those. On a 390px
     phone, Cloudinary delivered 1.6 and CSS then had to fit it into 0.462,
     which keeps 0.462/1.6 = 29% of the width and discards the other 71% —
     on top of whatever g_auto had already trimmed.

     Dropping the suffix means the loader's default `c_limit` applies, and
     c_limit only ever scales down; it never removes pixels. The whole frame
     arrives and there is exactly ONE crop, in CSS, steered by the single
     constant below.

     f_auto,q_auto are untouched by this — the loader emits them for every
     asset unconditionally, which is what converts the .heic to WebP/AVIF. */
  stillBottom: "v1787477348/nawarat_beats_varja_la6fm8.heic",
} as const;

/* ---------------------------------------------------------------------------
 * FOCAL POINT — the one line to tune
 *
 * BE CLEAR ABOUT WHAT object-cover CAN AND CANNOT PROMISE. It fills the panel
 * and crops the overflow; there is no value of object-position that makes an
 * entire image visible inside a box of a different shape. Only `object-contain`
 * can do that, and it letterboxes — see the escape hatch at the <Image> below.
 * What object-position does is choose WHICH part survives, and on this layout
 * that is worth getting right, because the surviving strip is 29% of the width
 * on a phone.
 *
 * 50% horizontally, 40% vertically is your suggested starting value and a sane
 * default: centred left-to-right, biased slightly above centre vertically,
 * which is where a subject's head or the visual weight of an object usually
 * sits. I could not verify it — res.cloudinary.com is not reachable from this
 * sandbox, so I have not seen nawarat_beats_varja. Treat 40% as a placeholder,
 * not a measurement.
 *
 * TO TUNE IT IN ABOUT A MINUTE: open the image on its own, read off roughly
 * where the centre of the subject falls as a percentage of the full frame, and
 * put those two numbers here. Left edge is 0%, right edge 100%; top 0%, bottom
 * 100%. If the subject sits in the upper third, `object-[50%_30%]`. If it is
 * off to the left, `object-[35%_40%]`.
 *
 * Remember which axis actually bites at which size: on a phone the panel is
 * TALLER than it is wide, so the vertical number does almost nothing and the
 * horizontal number decides everything. On a laptop it is the reverse. If one
 * value cannot serve both, this accepts a responsive pair, e.g.
 *
 *     "object-[38%_50%] md:object-[50%_35%]"
 * ------------------------------------------------------------------------ */

const STILL_BOTTOM_FOCAL = "object-[50%_40%]";

const ALT = {
  /* TODO(myo): describe what is actually in IMG_3327 — I have not seen it, so
     this is a neutral placeholder rather than an invented description. Alt text
     that guesses wrong is worse than alt text that is plainly generic. */
  stillTop: "Fortune chapter still",
  /* TODO(myo): same — the filename suggests nawarat (the nine gems) and a
     vajra, but I am not going to describe an image I cannot see. Two or three
     plain words about what is in the frame is all this needs. */
  stillBottom: "Fortune chapter still",
} as const;

/* ---------------------------------------------------------------------------
 * COPY — every string in one place, in both languages
 *
 * `{ en, my }` pairs rather than two parallel objects: a translation that sits
 * one line under its source cannot silently drift out of sync when one of them
 * is edited, and a third language later is a third key here rather than a
 * third object to keep aligned.
 *
 * Note the Myanmar digits in the kicker — ၀၄, not 04. Latin numerals dropped
 * into an otherwise Burmese line are the small tell that a translation was
 * machine-produced and never read by a person.
 * ------------------------------------------------------------------------ */

const COPY = {
  kicker: { en: "— Chapter 04 —", my: "— အခန်း ၀၄ —" },

  title: { en: "Fortune", my: "ကံကြမ္မာ" },

  blurb: {
    en: "Astrology, timing and reading what the sky is doing.",
    my: "နက္ခတ်ဗေဒင်၊ အချိန်ကာလနှင့် ကောင်းကင်ယံ၏ လှုပ်ရှားမှုများကို ဖတ်ရှုခြင်း။",
  },

  cta: { en: "Discover", my: "လေ့လာရန်" },

  /* NOTE: this still points at the gallery, which now sits below both
     FortunePhilosophy and MoonAscendant — so the button scrolls past two whole
     sections. Change to "#fortune-philosophy" if you would rather it land on
     the next one. Left as you had it, since you did not ask me to move it. */
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

         min-h raised 34rem → 38rem for the bilingual build. Three Burmese
         lines were added to this column (kicker, title, blurb) and the content
         stack grew by ~110px at the 390px breakpoint; at the old 34rem the CTA
         sat below the fold on a short landscape window. */
      className="relative h-svh min-h-[38rem] w-full overflow-hidden bg-black"
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
            /* NOT plain 50vw, and this is the cost of removing the Cloudinary
               crop — worth understanding before you touch it.

               `sizes` describes the RENDERED IMAGE BOX, not the panel. Under
               object-cover in a panel that is taller than the source, the image
               box is far wider than the panel: it is scaled up until its height
               covers, and the extra width is what gets clipped. On a 390px
               phone the panel is 195 x 422; a landscape source has to be scaled
               to roughly 630 CSS px wide before its height reaches 422. Ask for
               50vw there (195) and the browser fetches a file a third of the
               width it actually needs, then upscales it — a soft, mushy still
               that looks like a compression fault.

               So: 50vw from md up, where the panel is landscape and width
               genuinely drives the request, and 150vw below it, where height
               drives it and the image box overhangs the viewport. Overstating
               `sizes` is the documented way to buy resolution for a cover crop;
               it is not a hack.

               WHY 150 AND NOT 200. The exact figure depends on the source's
               aspect ratio, which I could not check — Cloudinary is not
               reachable from here. Working from the 422px panel height on a
               390px phone, the width the image box needs is 422 x sourceAR:

                   source 4:3 (1.33) -> 563 CSS px -> 1126 @2x -> fetches w_1200
                   source 3:2 (1.50) -> 633 CSS px -> 1266 @2x -> fetches w_1920
                   source 16:9 (1.78) -> 751 CSS px -> 1502 @2x -> fetches w_1920

               I measured both: 200vw makes the browser pick w_1920 on every
               phone, 150vw picks w_1200. For a still that sits behind a 62%
               black scrim in a 195x422 corner of the hero, 1920 is a lot of
               bytes for detail nobody sees, so 150vw is the better default.

               If your source is wider than 4:3 AND the still looks soft on a
               phone, raise this to 200vw. To find out which you have, paste the
               image URL into a browser tab and run in the console:
               `const i=document.querySelector('img'); i.naturalWidth/i.naturalHeight`

               If the extra bytes bother you more than the softness, the real
               fix is art direction — a portrait Cloudinary crop for phones and
               a landscape one for md+ — not shrinking this number further. */
            sizes="(min-width: 768px) 50vw, 150vw"
            /* object-cover + a focal point, per your brief. If you decide you
               would rather see the WHOLE frame with no crop at all, swap
               `object-cover` for `object-contain` here — it will letterbox
               against the section's black, which on this dark hero reads as
               deliberate rather than broken. The focal class becomes a no-op in
               that mode and can stay. */
            className={`object-cover ${STILL_BOTTOM_FOCAL}`}
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
          58%, not 70%. Worth remembering before reaching for a third.

          The dark band was widened from 38–66% to 32–72% for the bilingual
          build: the type column is taller now, and at the old stops the
          Burmese blurb fell off the bottom of the band onto the brighter still
          behind it. */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/25" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.30)_0%,rgba(0,0,0,0.62)_32%,rgba(0,0,0,0.62)_72%,rgba(0,0,0,0.42)_100%)]"
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
        {/* ---------- KICKER ---------- */}
        {/* ONE motion node holding both lines, per your brief: the pair rises
            together, so the eye reads it as a single label in two languages
            rather than as two separate arrivals. Same for the title and the
            blurb below. */}
        <motion.div variants={riseIn}>
          <p className="font-sans text-[0.7rem] font-semibold tracking-[0.4em] text-[#FDFBF7]/75 uppercase sm:text-xs">
            {COPY.kicker.en}
          </p>
          {/* tracking-normal and no `uppercase` — rule 2 in the header. 0.4em
              between Burmese clusters would pull the marks off the consonants
              they belong to. */}
          <p
            lang="my"
            className="font-myanmar mt-2 text-[0.8rem] leading-[1.7] font-normal tracking-normal text-[#FDFBF7]/50 sm:text-[0.875rem]"
          >
            {COPY.kicker.my}
          </p>
        </motion.div>

        {/* ---------- TITLE ---------- */}
        {/* Both languages live INSIDE the h1, deliberately: the page should
            have exactly one h1, and its accessible name should be the whole
            title — "Fortune ကံကြမ္မာ" — not the English half with the Burmese
            orphaned into a sibling <p> that announces as body text. */}
        <motion.h1
          variants={riseIn}
          className="mt-6 flex flex-col items-center"
        >
          {/* clamp rather than text-7xl/text-8xl: at a fixed 8xl the word runs
              past the edge of a 320px phone. This tops out at the same size on
              a wide screen and stays inside the viewport everywhere below. */}
          <span className="font-display text-[clamp(3.25rem,11vw,8rem)] leading-[0.95] font-medium tracking-[-0.03em] text-[#FDFBF7]">
            {COPY.title.en}
          </span>
          {/* ~35% of the English size and leading 1.6 against the English 0.95.
              Both numbers are Myanmar-specific: ကံကြမ္မာ carries a stacked
              medial below the line and an upper mark above it, so at Latin
              leading the top mark collides with the word above. */}
          <span
            lang="my"
            className="font-myanmar mt-3 text-[clamp(1.35rem,4.4vw,2.75rem)] leading-[1.6] font-normal tracking-normal text-[#FDFBF7]/65"
          >
            {COPY.title.my}
          </span>
        </motion.h1>

        {/* ---------- BLURB ---------- */}
        <motion.div variants={riseIn} className="mt-6 max-w-xl">
          <p className="font-script text-[clamp(1.05rem,2.2vw,1.35rem)] leading-[1.6] text-pretty text-[#FDFBF7]/85 italic">
            {COPY.blurb.en}
          </p>
          {/* mt-4 and a softer opacity, per the brief — but NOT italic. Rule 3
              in the header: there is no Myanmar italic to fall back on, so the
              browser would shear the glyphs. */}
          <p
            lang="my"
            className="font-myanmar mt-4 text-[clamp(0.9rem,1.9vw,1.05rem)] leading-[1.95] text-pretty text-[#FDFBF7]/60"
          >
            {COPY.blurb.my}
          </p>
        </motion.div>

        {/* ---------- CTA ---------- */}
        <motion.div variants={riseIn} className="mt-10">
          <a
            href={COPY.ctaHref}
            /* py trimmed 3.5 → 3 because the label is two lines now, so the
               pill keeps roughly the height it had with one. items-center
               aligns the arrow to the centre of the two-line stack rather than
               to the English line alone. */
            className="group relative inline-flex items-center gap-3 rounded-full border border-[#E29AA2]/45 bg-white/5 px-8 py-3 backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#E29AA2]/90 hover:bg-[#5E0B15]/45 hover:shadow-[0_0_0_1px_rgba(226,154,162,0.35),0_0_28px_rgba(94,11,21,0.65)] focus-visible:ring-2 focus-visible:ring-[#E29AA2]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <span className="flex flex-col items-center">
              <span className="font-sans text-[0.7rem] font-semibold tracking-[0.22em] text-[#FDFBF7] uppercase">
                {COPY.cta.en}
              </span>
              <span
                lang="my"
                className="font-myanmar mt-1 text-[0.8rem] leading-[1.5] font-normal tracking-normal text-[#FDFBF7]/70"
              >
                {COPY.cta.my}
              </span>
            </span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-[#FDFBF7] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
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
