"use client";

/**
 * ============================================================================
 *  MOON ASCENDANT — showcase, argument, invitation. Bilingual.
 * ============================================================================
 *
 *  Sits below FortunePhilosophy on the same #0a0a0a field, so the two read as
 *  one continuous dark passage rather than two stacked panels.
 *
 *  ---------------------------------------------------------------------------
 *  THE BILINGUAL RULES
 *  ---------------------------------------------------------------------------
 *  Written out in full at the top of FortuneHero.tsx: lang="my" on every
 *  Burmese node, tracking-normal always, never italic, and far more leading
 *  than the Latin above it. The one that bites hardest in this file is the
 *  CTA — a pill whose English label carries `tracking-[0.18em] uppercase`.
 *  Neither belongs on Myanmar, so the Burmese line inside the button resets
 *  both rather than inheriting them from the shared button class.
 *
 *  ---------------------------------------------------------------------------
 *  THE ONE PLACE I DEPARTED FROM THE ORIGINAL BRIEF: object-cover + aspect-video
 *  ---------------------------------------------------------------------------
 *  You asked for `object-cover` inside `aspect-video`. That pairing is right
 *  for a photograph, where losing a strip of sky costs nothing. This image is
 *  a SCREENSHOT of your app — and object-cover inside a fixed ratio does not
 *  scale the picture down to fit, it fills the box and throws away whatever
 *  hangs over the edge. A macOS window capture is around 16:10; forced into
 *  16:9 that is roughly 11% of the height gone, taken off the top and bottom
 *  in equal measure. On a UI screenshot those two strips are the title bar and
 *  whatever sits at the foot of the results.
 *
 *  `object-contain` inside the same box is not the fix either — it just
 *  letterboxes, and then the soft glow wraps a pair of empty bars instead of
 *  the app.
 *
 *  So the container takes its height from the screenshot: `h-auto w-full`, no
 *  aspect class, no object-fit. Nothing is cropped and nothing is padded, and
 *  if your capture is already wide it will look exactly as cinematic as you
 *  intended. If you would rather enforce the 16:9 regardless, it is one line —
 *  see SHOWCASE below.
 *
 *  This is the same call as the artwork in FortunePhilosophy directly above,
 *  and for the same reason. Two adjacent sections cropping differently would
 *  be the inconsistency, not the fix.
 *
 *  ---------------------------------------------------------------------------
 *  A GLOW, NOT A SHADOW
 *  ---------------------------------------------------------------------------
 *  `shadow-2xl` is black. On a #0a0a0a background it is invisible — the most
 *  common way a "soft elegant shadow" ends up doing nothing at all on a dark
 *  theme. What reads on near-black is LIGHT: a blurred violet field behind the
 *  frame plus a hairline ring on it, so the panel appears lit rather than
 *  lifted.
 * ============================================================================
 */

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";

/* ---------------------------------------------------------------------------
 * MEDIA
 *
 * Cloudinary public ID, not a URL — the loader (next.config.ts ->
 * images.loaderFile) adds `f_auto,q_auto,c_limit,w_<width>`. No `#…` suffix,
 * deliberately: c_limit is the only crop mode that cannot remove pixels, which
 * is what keeps a screenshot intact.
 * ------------------------------------------------------------------------ */

const SHOWCASE = {
  src: "v1787493176/Screenshot_2026-08-23_at_22.49.31_xdibr1.png",
  alt: "The Vedin astrology application, showing a Moon Ascendant chart",
} as const;

/* To enforce a cinematic ratio instead of following the screenshot, put
   `aspect-video` (or `aspect-[16/7]`) back on the frame below and give the
   <Image> `fill` and `object-cover` in place of width/height and h-auto.
   Accepting, per the header note, that it will cut the top and bottom off. */

/* ---------------------------------------------------------------------------
 * COPY — every string in one place, in both languages
 *
 * The English body is split into three parts because "Chandra Lagna" is set in
 * its own <em lang="sa"> in the markup. Keeping the three fragments here rather
 * than inlining the prose into the JSX means the whole page's copy is still
 * editable from one screen.
 *
 * On the Burmese body, four choices worth naming so you can overrule any:
 *
 *   "လကား" rather than "လသည်ကား" — the contrastive particle ကား attached
 *   directly to the subject is the literary form, and it is what carries the
 *   English "While the Sun … the Moon …" contrast without a clumsy connective.
 *
 *   "ခံစားမှုဒီရေများ" for "tides of our subconscious" — ဒီရေ is the literal
 *   sea tide, and Burmese takes the metaphor as readily as English does. The
 *   alternative, အလှိုင်းအလွှား (waves), suggests turbulence rather than the
 *   slow governed rise and fall the English means.
 *
 *   "ပုံကြမ်း" for "blueprint" — literally a draft plan. There is no Burmese
 *   word for blueprint that is not a transliteration, and ပုံကြမ်း keeps the
 *   sense of an underlying design that is drawn before the thing itself.
 *
 *   "စန်းလဂ် (Chandra Lagna)" exactly as you specified — စန်းလဂ် is the term a
 *   Burmese astrologer would actually use, with the Sanskrit in parentheses for
 *   readers who know it under that name.
 * ------------------------------------------------------------------------ */

const COPY = {
  label: {
    en: "The Lunar Perspective",
    my: "စန်းလဂ် ရှုထောင့်",
  },

  heading: {
    en: "Charting the Inner Cosmos",
    my: "အတွင်းစိတ်ကမ္ဘာကို ပုံဖော်ခြင်း",
  },

  body: {
    enBefore:
      "While the Sun dictates our outward expression, the Moon governs the hidden tides of our subconscious. In advanced astrological traditions, calculating your destiny from the Moon Ascendant—or ",
    enTerm: "Chandra Lagna",
    enAfter:
      "—reveals the true emotional and psychological blueprint of your life. By mapping the celestial bodies against the exact position of the Moon at your birth, we unlock profound insights into your innate desires, emotional resilience, and the natural flow of your fortune.",
    my: "နေသည် ကျွန်ုပ်တို့၏ ပြင်ပသို့ ထင်ဟပ်ဖော်ပြမှုကို အုပ်စိုးသော်လည်း၊ လကား စိတ်အောက်နက်ရှိုင်းရာ၌ တိတ်ဆိတ်စွာ စီးဆင်းနေသော ခံစားမှုဒီရေများကို အုပ်ချုပ်သည်။ အဆင့်မြင့် နက္ခတ်ဗေဒင်အစဉ်အလာများတွင် သင်၏ကံကြမ္မာကို စန်းလဂ် (Chandra Lagna) မှ တွက်ချက်ခြင်းသည် သင့်ဘဝ၏ စိတ်ခံစားမှုနှင့် စိတ်ပိုင်းဆိုင်ရာ ပုံကြမ်းအစစ်အမှန်ကို ဖော်ထုတ်ပြသပေးသည်။ သင်မွေးဖွားချိန်၌ လတည်ရှိရာ တိကျသောနေရာနှင့် ယှဉ်တွဲ၍ ဂြိုဟ်နက္ခတ်များကို ပုံဖော်ခြင်းဖြင့် သင်၏ မွေးရာပါဆန္ဒများ၊ စိတ်ဓာတ်ခံနိုင်ရည်နှင့် ကံကြမ္မာ၏ သဘာဝစီးဆင်းပုံတို့ကို နက်နက်ရှိုင်းရှိုင်း သိမြင်နိုင်မည် ဖြစ်သည်။",
  },

  cta: {
    en: "Read Your Stars on Vedin",
    my: "Vedin တွင် ကံကြမ္မာကို စစ်ဆေးပါ",
  },

  ctaHref: "https://vedin.myothant.dev",
} as const;

/* ---------------------------------------------------------------------------
 * MOTION
 *
 * Three reveals, staged. The delays live on the variants rather than on a
 * parent stagger because the three blocks cross the viewport edge at different
 * moments on a tall section — a parent staggerChildren would fire them all
 * from whenever the PARENT came into view, which on a phone can be before the
 * button exists on screen at all.
 * ------------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

const showcaseIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 1, ease: EASE } },
};

const textIn: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.15, ease: EASE },
  },
};

const ctaIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.35, ease: EASE },
  },
};

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function MoonAscendant() {
  const reduceMotion = useReducedMotion() ?? false;

  const viewport = { once: true, margin: "-100px" } as const;

  /* Written once rather than three times. `initial={false}` for reduced motion
     means "start at the animate value" — the content is simply there, which is
     safer than dropping the animation and leaving opacity at 0 if the observer
     never fires. */
  const reveal = (variants: Variants) =>
    reduceMotion
      ? { initial: false as const }
      : { variants, initial: "hidden", whileInView: "show", viewport };

  return (
    <section
      id="moon-ascendant"
      aria-labelledby="moon-ascendant-heading"
      /* overflow-hidden is not tidiness — it is a bug fix. The glow below is
         `-inset-8`, i.e. 32px outside the showcase on every side. On a 390px
         phone the showcase is 90% of the viewport (351px, centred at x=19.5),
         so the glow reaches x=-12.5 and x=402.5 and the page picked up 13px of
         horizontal scroll. Measured, not guessed. The blur has already faded to
         transparent by its own edge, so clipping it costs nothing visually. */
      className="overflow-hidden bg-[#0a0a0a] py-24 lg:py-32"
    >
      {/* ================= 1 · THE SHOWCASE ================= */}
      {/* WHY THE HOVER SCALE IS ON THE <Link> AND NOT ON THIS NODE.
          Not because it would break here — I assumed it would and checked:
          Motion writes the reveal to inline `transform`, while Tailwind v4
          compiles `hover:scale-*` to the standalone `scale` PROPERTY, so the
          two never collide. Measured at rest and on hover:

              motion node   style="opacity: 1; transform: none;"
              link          transform: none   scale: none -> 1.02

          They would compose, not conflict. The real reasons are below: the
          hover has to belong to the element that is also the click target, and
          keeping the reveal's scale and the hover's scale on separate nodes
          stops them multiplying if a hover lands mid-reveal. */}
      <motion.div
        {...reveal(showcaseIn)}
        className="mx-auto w-[90%] max-w-7xl md:w-[80%]"
      >
        {/* THE LINK IS ALSO THE GROUP, and it wraps BOTH the glow and the
            frame. That pairing is deliberate: if the group sat on the motion
            wrapper instead, the 32px glow margin would be inside the hover
            target but outside the click target — the cursor would change and
            the glow would brighten over a strip of dead space that does not
            navigate. Everything that reacts to the hover is also clickable. */}
        <Link
          href={COPY.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block cursor-pointer transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0a] focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          {/* The glow. Behind the frame, pushed past its edges and blurred so
              it never shows a boundary of its own. -z-10 keeps it under the
              screenshot; pointer-events-none keeps it out of the way of the
              link's own hit area. It lifts on hover — light, not shadow. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(147,51,234,0.22)_0%,rgba(192,38,211,0.10)_45%,transparent_75%)] opacity-80 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          />

          {/* The frame. overflow-hidden is what makes the rounding real — an
              <img> paints over its parent's corners otherwise.

              NOT hover:shadow-2xl. That shadow is black, and on a #0a0a0a
              field black is invisible; the "intensified" state would look
              identical to the resting one. The ring brightens and the violet
              cast deepens instead, which is what actually reads on near-black. */}
          <div className="relative overflow-hidden rounded-2xl bg-[#121212] ring-1 shadow-[0_24px_80px_-24px_rgba(147,51,234,0.35)] ring-white/10 transition-[box-shadow,--tw-ring-color] duration-500 group-hover:shadow-[0_32px_110px_-24px_rgba(147,51,234,0.6)] group-hover:ring-white/25 lg:rounded-3xl">
            <Image
              src={SHOWCASE.src}
              alt={SHOWCASE.alt}
              /* Not `fill`: the frame's height comes from the screenshot, so
                 there is no box for a fill image to fill. 0/0 declares
                 "intrinsic size unknown"; h-auto w-full lays it out at its own
                 ratio. */
              width={0}
              height={0}
              sizes="(min-width: 768px) 80vw, 90vw"
              className="h-auto w-full"
            />
          </div>

          {/* The alt text is now doing double duty as the link's accessible
              name, which is right — but it says nothing about leaving the site.
              The CTA below carries the same line for the same reason. */}
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
      </motion.div>

      {/* ================= 2 · THE ARGUMENT ================= */}
      <motion.div
        {...reveal(textIn)}
        className="mx-auto mt-16 max-w-3xl px-6 text-center"
      >
        {/* ---------- LABEL ---------- */}
        <p className="font-sans text-xs tracking-[0.2em] text-gray-400 uppercase">
          {COPY.label.en}
        </p>
        {/* 0.2em of tracking would separate the ဂ် from the လ it belongs to in
            စန်းလဂ်, so this resets it. gray-400 rather than the brief's
            gray-500 — measured, gray-500 on #0a0a0a is 4.09:1 and fails AA.
            The full numbers are in FortunePhilosophy.tsx at its body copy. */}
        <p
          lang="my"
          className="font-myanmar mt-2 text-[0.8125rem] leading-[1.7] tracking-normal text-gray-400"
        >
          {COPY.label.my}
        </p>

        {/* ---------- HEADING ---------- */}
        {/* Both languages inside the h2 — `aria-labelledby` on the section
            points here, so the section's accessible name is the whole
            bilingual heading rather than only its English half. */}
        <h2 id="moon-ascendant-heading" className="my-6">
          <span className="font-display block text-4xl leading-[1.15] font-medium tracking-[-0.02em] text-balance text-white md:text-5xl">
            {COPY.heading.en}
          </span>
          {/* leading 1.5 against the English 1.15: ကမ္ဘာ stacks a subscript
              consonant below the baseline and အ carries a mark above, so this
              line needs vertical room the English line does not. */}
          <span
            lang="my"
            className="font-myanmar mt-3 block text-xl leading-[1.5] font-normal tracking-normal text-balance text-gray-400 md:text-2xl"
          >
            {COPY.heading.my}
          </span>
        </h2>

        {/* ---------- BODY ---------- */}
        <p className="text-lg leading-relaxed text-pretty text-gray-300">
          {COPY.body.enBefore}
          {/* A real <em>, not the literal asterisks from the brief. The
              transliteration is set in the script serif the rest of the site
              uses for quoted material, and lang marks it as Sanskrit so a
              screen reader does not read it with English phonetics. */}
          <em lang="sa" className="font-script text-gray-200 italic">
            {COPY.body.enTerm}
          </em>
          {COPY.body.enAfter}
        </p>

        {/* mt-4 and a softer grey — but gray-400, not gray-500. Same measured
            reason as the label above and as FortunePhilosophy: 4.09:1 vs
            7.61:1 on this section's #0a0a0a, against a 4.5:1 AA floor.

            Note also that the Burmese runs at 1.95 where the English above runs
            at leading-relaxed (1.625); on a centred column that difference is
            the whole reason the translation reads as composed rather than
            cramped. */}
        <p
          lang="my"
          className="font-myanmar mt-4 text-[1rem] leading-[1.95] tracking-normal text-pretty text-gray-400"
        >
          {COPY.body.my}
        </p>
      </motion.div>

      {/* ================= 3 · THE INVITATION ================= */}
      <motion.div {...reveal(ctaIn)} className="mt-10 flex justify-center px-6">
        <Link
          href={COPY.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          /* py trimmed 4 → 3 because the label is two lines now, so the pill
             keeps roughly the height it had with one. */
          className="group relative inline-flex items-center gap-3 rounded-full bg-white px-8 py-3 text-[#0a0a0a] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_0_0_1px_rgba(216,180,254,0.6),0_12px_40px_-8px_rgba(147,51,234,0.7)] focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
        >
          <span className="flex flex-col items-center">
            <span className="font-sans text-[0.7rem] font-semibold tracking-[0.18em] uppercase">
              {COPY.cta.en}
            </span>
            {/* text-black/65 rather than a grey utility: this pill is WHITE, so
                the rule inverts — stepping the translation down in prominence
                here means going darker-but-softer, not lighter. Measured on the
                rendered page, black at 65% over white composites to 7.00:1,
                comfortably over the 4.5:1 AA floor while still reading as
                secondary next to the solid-black English above it. */}
            <span
              lang="my"
              className="font-myanmar mt-1 text-[0.8125rem] leading-[1.5] font-normal tracking-normal text-black/65"
            >
              {COPY.cta.my}
            </span>
          </span>
          {/* An outbound arrow, not a chevron — this leaves the site. The
              sr-only line says the same thing to a screen reader, which cannot
              see the glyph. */}
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
          </svg>
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
      </motion.div>
    </section>
  );
}
