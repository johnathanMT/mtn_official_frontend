import type { Metadata } from "next";
import ChapterHero from "@/components/chapter/ChapterHero";
import { MEDIA, getGallery } from "@/config/mediaControl";
import { getChapter } from "@/config/navigation";

/* Route config lives in src/config/navigation.ts — label, blurb and cover
   image all resolve from there, so this file stays almost empty.

   Back-to-home and the footer are provided by src/app/(chapters)/layout.tsx. */
const CHAPTER = getChapter("/fortune")!;

export const metadata: Metadata = {
  title: "Fortune",
  description: CHAPTER.blurb,
  alternates: { canonical: "/fortune" },
  openGraph: {
    title: "Fortune | Myo Thant Naing",
    description: CHAPTER.blurb,
    url: "/fortune",
  },
};

export default function FortunePage() {
  const photos = getGallery("fortune");

  return (
    <main id="main">
      <ChapterHero
        eyebrow="Chapter 04"
        title="Fortune"
        blurb={CHAPTER.blurb}
        cover={MEDIA.chapters.fortune}
      />

      {/* ---- Gallery goes here. Scaffold only for now. ---- */}
      <section className="container-premium py-20 lg:py-28">
        <p className="text-ink-muted max-w-md text-sm">
          {photos.length} photo{photos.length === 1 ? "" : "s"} registered for
          this chapter in the media control room. The gallery layout lands next.
        </p>
      </section>
    </main>
  );
}
