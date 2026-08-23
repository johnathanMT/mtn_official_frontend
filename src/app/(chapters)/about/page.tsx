import type { Metadata } from "next";
import ChapterHero from "@/components/chapter/ChapterHero";
import { MEDIA } from "@/config/mediaControl";
import { chapterEyebrow, getChapter } from "@/config/navigation";

/* Route config lives in src/config/navigation.ts — label, blurb and cover
   image all resolve from there, so this file stays almost empty.

   Back-to-home and the footer are provided by src/app/(chapters)/layout.tsx. */
const CHAPTER = getChapter("/about")!;

export const metadata: Metadata = {
  title: "About me",
  description: CHAPTER.blurb,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About me | Myo Thant Naing",
    description: CHAPTER.blurb,
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <main id="main">
      <ChapterHero
        eyebrow={chapterEyebrow("/about").en}
        title="About me"
        blurb={CHAPTER.blurb}
        cover={MEDIA.chapters.about}
      />

      <section className="container-premium py-20 lg:py-28">
        <p className="text-ink-muted font-script max-w-2xl text-lg leading-relaxed italic">
          Scaffold only — the biography, the path through engineering, and the
          chapters of a life land with the rest of the build.
        </p>
      </section>
    </main>
  );
}
