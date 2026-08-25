/**
 * ============================================================================
 *  PROFILE SECTION — architectural grid, hexagon portrait
 * ============================================================================
 *
 *  Dark grey field under the navy 3D hero. Four columns divided by 1px rules,
 *  a hexagon portrait on the centre spine, and the practice labels seated at
 *  the grid's corners.
 *
 *  ---------------------------------------------------------------------------
 *  WHY THE RULES AND THE COLUMNS CANNOT DRIFT
 *  ---------------------------------------------------------------------------
 *  The vertical rules are drawn by an absolute layer at left-1/4, left-1/2 and
 *  left-3/4. The content grid is `grid-cols-4`. Those are the same fractions,
 *  so every rule lands exactly on a column boundary at every viewport width —
 *  no magic numbers, nothing to re-tune when the container padding changes.
 *
 *  This is also why the layout is a grid rather than absolutely-positioned
 *  "floating" blocks. Scattered placement that is actually pinned to the grid
 *  survives a resize; scattered placement done with top/left offsets does not,
 *  and this design lives or dies on those lines staying true.
 *
 *  ---------------------------------------------------------------------------
 *  THE COMPOSITION
 *  ---------------------------------------------------------------------------
 *      ┌──────────┬─────────────────────┬──────────┐
 *      │ 01 label │                     │ 02 label │   ← labels ride the top
 *      │          │   hexagon portrait  │          │
 *      │          │   (centre spine)    │          │
 *      ├──────────┼──────────┬──────────┼──────────┤
 *      │ 03 label │   maroon manifesto    │ 04 label │
 *      └──────────┴─────────────────────┴──────────┘
 *
 *  ---------------------------------------------------------------------------
 *  RESPONSIVE
 *  ---------------------------------------------------------------------------
 *  Below lg the four columns collapse to one and the order becomes labels /
 *  portrait / labels. The 1/4 and 3/4 rules are hidden there — they would no
 *  longer sit on a column boundary, and a rule that lines up with nothing is
 *  just a scratch on the page.
 * ============================================================================
 */

import Image from "next/image";
import { MEDIA, imageProps } from "@/config/mediaControl";
import ProfileSlogan from "@/components/sections/ProfileSlogan";
import ProfileZawgyi3D from "@/components/sections/ProfileZawgyi3D";

/** Dark grey canvas — not navy, not black. */
const FIELD = "#2A2A2A";

const DETAILS = {
  topLeft: { id: "01", label: "Creative Web Development" },
  topRight: { id: "02", label: "Next.js & React Three Fiber" },
  bottomLeft: { id: "03", label: "AI Engineering & Agentic AI Systems" },
  bottomRight: { id: "04", label: "Interactive 3D Experiences" },
} as const;

/* ---------------------------------------------------------------------------
 * SHARED TYPE SCALES
 *
 * Declared once. Six labels sharing a string is what keeps tracking identical
 * across the grid — the thing the eye notices immediately when it is not.
 * ------------------------------------------------------------------------ */

const LABEL = "font-sans text-[0.6rem] leading-snug tracking-[0.26em] uppercase";
const INDEX = "font-sans text-[0.6rem] tracking-[0.3em] text-stone-500";
const RULE = "bg-white/12";

/* ---------------------------------------------------------------------------
 * CONTINUOUS RULES
 * ------------------------------------------------------------------------ */

function GridRules() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <div className={`${RULE} absolute inset-y-0 left-0 w-px`} />
      {/* All three interior rules are lg-only, INCLUDING the centre one. Below
          lg the grid is a single column, so a rule at 50% has no boundary to
          sit on — it runs through left-aligned labels and reads as a scratch on
          the page rather than as structure. The row borders carry the
          architecture on small screens. */}
      <div className={`${RULE} absolute inset-y-0 left-1/4 hidden w-px lg:block`} />
      <div className={`${RULE} absolute inset-y-0 left-1/2 hidden w-px lg:block`} />
      <div className={`${RULE} absolute inset-y-0 left-3/4 hidden w-px lg:block`} />
      <div className={`${RULE} absolute inset-y-0 right-0 w-px`} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * FLOATING DETAIL
 * ------------------------------------------------------------------------ */

function Detail({
  id,
  label,
  align = "left",
}: {
  id: string;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col gap-2.5 ${align === "right" ? "lg:items-end lg:text-right" : ""}`}
    >
      <span className={INDEX}>{id}</span>
      <span aria-hidden="true" className={`${RULE} h-px w-8`} />
      <p className={`${LABEL} max-w-[16ch] text-stone-200`}>{label}</p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * HEXAGON PORTRAIT
 *
 * Photo stays in the pointy-top hex. A second hex — old-gold hairline, no
 * fill — sits behind it, rotated 30° so its vertices peek out of the flats.
 * The wire drifts; the photograph does not.
 *
 * clip-path cannot take a border, so the photo ring is still a slightly
 * larger hex sitting behind the image.
 * ------------------------------------------------------------------------ */

const GOLD_WIRE = "#CFB53B";

/** Same vertices as `clip-hexagon`, inset so the stroke is not clipped. */
const HEX_POINTS = "50,1.4 98.6,25.7 98.6,74.3 50,98.6 1.4,74.3 1.4,25.7";

function HexagonPortrait() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem] overflow-visible">
      {/* Static 30° + larger than the photo so the points clear the flats
          even if the drift animation never runs. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[136%] w-[136%] -translate-x-1/2 -translate-y-1/2 rotate-[30deg]"
      >
        <svg
          viewBox="0 0 100 100"
          className="hex-wire-drift h-full w-full origin-center"
        >
          <polygon
            points={HEX_POINTS}
            fill="none"
            stroke={GOLD_WIRE}
            strokeWidth="2"
            strokeLinejoin="miter"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div
        className="clip-hexagon relative z-10 p-[2px]"
        style={{ backgroundColor: GOLD_WIRE }}
      >
        <div className="clip-hexagon relative aspect-square w-full overflow-hidden bg-stone-800">
          <Image
            {...imageProps(MEDIA.landing.portrait, {
              fill: true,
              transformations: ["c_fill,g_auto,ar_1:1"],
            })}
            alt={MEDIA.landing.portrait.alt}
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 88vw"
            className="clip-hexagon h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * SECTION
 * ------------------------------------------------------------------------ */

export default function ProfileSection() {
  return (
    <section
      aria-labelledby="profile-heading"
      className="relative isolate min-h-svh overflow-hidden text-stone-100"
      style={{ backgroundColor: FIELD }}
    >
      <GridRules />

      {/* Continues the hero dissolve so the two sections share a colour, not
          a cut. Behind the type (z-10), above the rules. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-1 h-28 sm:h-36"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgb(11 59 76 / 0.4) 0%, rgb(42 42 42 / 0) 100%)",
        }}
      />

      {/* ---------- TOP BAR ---------- */}
      {/* The bar used to read "01 · Profile · 02". Those numbers now collide
          with the 01-04 indices on the detail blocks below — two numbering
          systems, same typeface, same size, different meanings, eight inches
          apart. The range on the right explains the indices instead of
          competing with them. */}
      <div className="relative z-10 flex h-20 items-center justify-between border-b border-white/10 px-5 sm:px-8 lg:px-12">
        <span className={`${LABEL} text-stone-100`}>Profile</span>
        <span className={INDEX}>01 — 04</span>
      </div>

      <h2 id="profile-heading" className="sr-only">
        Profile
      </h2>

      {/* ---------- STAGE ----------
          One grid, four columns on lg. Labels pinned to the top of the outer
          cells; the hexagon holds the centre. */}
      <div className="relative z-10 grid grid-cols-1 border-b border-white/10 lg:grid-cols-4">
        <div className="px-5 pt-10 pb-8 sm:px-8 lg:px-12 lg:pt-14 lg:pb-14">
          <Detail {...DETAILS.topLeft} />
        </div>

        <div className="flex flex-col items-center justify-center overflow-visible border-y border-white/10 px-5 py-12 sm:px-8 lg:col-span-2 lg:border-x lg:border-y-0 lg:px-10 lg:py-16">
          <HexagonPortrait />
          <div className="mt-10 w-full">
            <ProfileZawgyi3D />
          </div>
        </div>

        <div className="px-5 pt-10 pb-12 sm:px-8 lg:px-12 lg:pt-14 lg:pb-14">
          <Detail {...DETAILS.topRight} align="right" />
        </div>
      </div>

      {/* ---------- FOOT ----------
          Same four columns. The manifesto takes the middle two so it sits on
          the centre spine, directly under the portrait. */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4">
        <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <Detail {...DETAILS.bottomLeft} />
        </div>

        <div className="border-y border-white/10 px-5 py-10 sm:px-8 lg:col-span-2 lg:border-x lg:border-y-0 lg:px-10 lg:py-12">
          <ProfileSlogan />
        </div>

        <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <Detail {...DETAILS.bottomRight} align="right" />
        </div>
      </div>
    </section>
  );
}
