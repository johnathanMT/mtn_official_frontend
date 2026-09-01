import type { Metadata } from "next";
import ChapterHero from "@/components/chapter/ChapterHero";
import ArtLonelinessMount from "@/components/three/ArtLonelinessMount";
import { MEDIA, getGallery } from "@/config/mediaControl";
import { chapterEyebrow, getChapter } from "@/config/navigation";

const CHAPTER = getChapter("/art")!;

export const metadata: Metadata = {
  title: "Art",
  description: CHAPTER.blurb,
  alternates: { canonical: "/art" },
  openGraph: {
    title: "Art | Myo Thant Naing",
    description: CHAPTER.blurb,
    url: "/art",
  },
};

export default function ArtPage() {
  const photos = getGallery("art");

  return (
    <main id="main">
      <ChapterHero
        eyebrow={chapterEyebrow("/art").en}
        title="Art"
        blurb={CHAPTER.blurb}
        cover={MEDIA.chapters.art}
      />

      {/* The verse used to live in the section below. It is now an overlay on
          the canvas itself, so it reads as part of the place rather than as a
          caption underneath it. */}
      <ArtLonelinessMount />

      <section className="bg-[#0d0725] px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <p className="font-sans text-[0.58rem] tracking-[0.32em] text-white/35 uppercase">
            Click the scene to walk · W A S D to move · Shift to run · Esc to
            leave
          </p>
          {photos.length > 0 ? (
            <p className="font-sans text-[0.58rem] tracking-[0.28em] text-white/25 uppercase">
              {photos.length} still{photos.length === 1 ? "" : "s"} wait in the
              archive
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
