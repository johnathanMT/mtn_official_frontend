/**
 * ============================================================================
 *  MODERN ART COLLAGE — Fibonacci spiral / golden frame
 * ============================================================================
 *
 *  Nested 61.8 / 38.2 flex splits, with a 2px gold gap on every axis so the
 *  cuts read as a single hairline rather than doubled borders. Prints sit at
 *  full colour; hover zooms the photograph inside its cell.
 *
 *  Images resolve from src/config/mediaControl.ts. No URLs here.
 * ============================================================================
 */

import Image from "next/image";

import { MEDIA, imageProps, type ImageAsset } from "@/config/mediaControl";

function SpiralPrint({
  asset,
  mark,
  sizes,
}: {
  asset: ImageAsset;
  mark: string;
  /**
   * The cell's real share of the viewport, NOT "100vw".
   *
   * Measured at 1440px the eight cells are 889, 549, 338, 209, 128, 79, 39 and
   * 39 pixels wide. With sizes="100vw" every one of them asked Cloudinary for
   * a 1440px-wide rendition — including the two 39px squares, and on a 390px
   * phone the innermost pair are 9x12px asking for a 390px image. Each value
   * below is that cell's fraction of the spiral, rounded up a little.
   */
  sizes: string;
}) {
  return (
    <div className="group relative h-full w-full overflow-hidden">
      <Image
        {...imageProps(asset, { fill: true })}
        alt={asset.alt}
        sizes={sizes}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <span className="pointer-events-none absolute right-4 bottom-4 z-10 font-display text-sm text-[#FDFBF7]/70 md:text-base">
        {mark}
      </span>
    </div>
  );
}

export default function ModernArtCollage() {
  return (
    <section
      aria-label="Photographic spiral"
      /* w-full, not w-screen. <main> already spans the full width, so the
         left-1/2 / -ml-[50vw] full-bleed hack bought nothing — and w-screen is
         100vw, which INCLUDES the classic scrollbar on Windows and Linux
         Chrome. That makes the section ~15px wider than the viewport and puts
         a horizontal scrollbar on the whole page. macOS overlay scrollbars
         hide the bug locally; the visitors who see it are on other machines. */
      className="relative flex aspect-[1.618/1] w-full gap-[2px] overflow-hidden bg-[#D4AF37] md:aspect-[2/1]"
    >
      {/* Level 1 — horizontal: 61.8 left / 38.2 right */}
      <div className="h-full min-h-0 min-w-0 flex-[61.8]">
        <SpiralPrint sizes={"62vw"} asset={MEDIA.collage.torii} mark="13" />
      </div>

      <div className="flex h-full min-h-0 min-w-0 flex-[38.2] flex-col gap-[2px]">
        {/* Level 2 — vertical: 61.8 top / 38.2 bottom */}
        <div className="min-h-0 min-w-0 w-full flex-[61.8]">
          <SpiralPrint sizes={"38vw"} asset={MEDIA.collage.still} mark="8" />
        </div>

        <div className="flex min-h-0 min-w-0 w-full flex-[38.2] flex-row-reverse gap-[2px]">
          {/* Level 3 — row-reverse: 61.8 on the right */}
          <div className="h-full min-h-0 min-w-0 flex-[61.8]">
            <SpiralPrint sizes={"24vw"} asset={MEDIA.collage.indra} mark="5" />
          </div>

          <div className="flex h-full min-h-0 min-w-0 flex-[38.2] flex-col-reverse gap-[2px]">
            {/* Level 4 — col-reverse: 61.8 at the bottom */}
            <div className="min-h-0 min-w-0 w-full flex-[61.8]">
              <SpiralPrint sizes={"15vw"} asset={MEDIA.collage.joso} mark="3" />
            </div>

            <div className="flex min-h-0 min-w-0 w-full flex-[38.2] flex-row gap-[2px]">
              {/* Level 5 — horizontal: 61.8 left / 38.2 right */}
              <div className="h-full min-h-0 min-w-0 flex-[61.8]">
                <SpiralPrint
                  sizes={"10vw"}
                  asset={MEDIA.collage.bikeShadow}
                  mark="2"
                />
              </div>

              <div className="flex h-full min-h-0 min-w-0 flex-[38.2] flex-col gap-[2px]">
                {/* Level 6 — vertical: 61.8 top / 38.2 bottom */}
                <div className="min-h-0 min-w-0 w-full flex-[61.8]">
                  <SpiralPrint
                    sizes={"6vw"}
                    asset={MEDIA.collage.osakaSky}
                    mark="1"
                  />
                </div>

                <div className="flex min-h-0 min-w-0 w-full flex-[38.2] flex-row-reverse gap-[2px]">
                  {/* Level 7 & 8 — innermost 50 / 50 */}
                  <div className="h-full min-h-0 min-w-0 flex-1">
                    <SpiralPrint
                      sizes={"4vw"}
                      asset={MEDIA.collage.lotus}
                      mark="1"
                    />
                  </div>
                  <div className="h-full min-h-0 min-w-0 flex-1">
                    <SpiralPrint
                      sizes={"4vw"}
                      asset={MEDIA.collage.gadotpwal}
                      mark="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
