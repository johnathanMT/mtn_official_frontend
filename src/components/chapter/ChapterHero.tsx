/**
 * ChapterHero — the full-bleed opener every chapter route shares.
 *
 * Deliberately a Server Component: the entrance is done with the CSS
 * keyframes in globals.css rather than Framer Motion, so these pages ship no
 * JavaScript beyond the navbar. On a media-led site the photograph should
 * paint as early as possible.
 *
 * The image resolves through imageProps(), so a local placeholder today and a
 * Cloudinary public ID tomorrow both work with no change here.
 */

import Image from "next/image";
import { imageProps, type ImageAsset } from "@/config/mediaControl";

interface ChapterHeroProps {
  eyebrow: string;
  title: string;
  blurb: string;
  cover: ImageAsset;
}

export default function ChapterHero({
  eyebrow,
  title,
  blurb,
  cover,
}: ChapterHeroProps) {
  return (
    <section
      aria-label={title}
      className="bg-secondary-950 relative isolate flex min-h-[70svh] items-end overflow-hidden lg:min-h-[80svh]"
    >
      <Image
        {...imageProps(cover, { fill: true, priority: true })}
        alt={cover.alt}
        sizes="100vw"
        className="-z-20 object-cover"
      />

      {/* Scrim — same three-layer recipe as the landing hero so the chapters
          feel like one family. */}
      <div
        aria-hidden="true"
        className="from-secondary-950 via-secondary-950/55 absolute inset-0 -z-10 bg-gradient-to-t to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-secondary-950/80 absolute inset-0 -z-10 bg-gradient-to-r via-transparent to-transparent"
      />

      <div className="container-premium animate-fade-up relative w-full pt-40 pb-16 lg:pt-44 lg:pb-24">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="bg-accent h-px w-8 sm:w-10" />
          <span className="text-primary/75 text-[0.62rem] font-semibold tracking-[0.16em] uppercase sm:text-xs sm:tracking-[0.22em]">
            {eyebrow}
          </span>
        </div>

        <h1 className="text-primary font-display mt-5 text-[clamp(2.75rem,8vw,6rem)] leading-[0.95] font-medium tracking-[-0.03em]">
          {title}
        </h1>

        <p className="text-primary/75 mt-6 max-w-md text-base text-balance sm:text-lg">
          {blurb}
        </p>
      </div>
    </section>
  );
}
