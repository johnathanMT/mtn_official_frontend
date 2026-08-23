import type { Metadata } from "next";
import AdventureHero from "@/components/chapter/AdventureHero";
import { getGallery } from "@/config/mediaControl";
import { getChapter } from "@/config/navigation";

/* Route config lives in src/config/navigation.ts — label, blurb and cover
   image all resolve from there, so this file stays almost empty.

   Back-to-home and the footer are provided by src/app/(chapters)/layout.tsx. */
const CHAPTER = getChapter("/adventure")!;

export const metadata: Metadata = {
  title: "Adventure",
  description: CHAPTER.blurb,
  alternates: { canonical: "/adventure" },
  openGraph: {
    title: "Adventure | Myo Thant Naing",
    description: CHAPTER.blurb,
    url: "/adventure",
  },
};

export default function AdventurePage() {
  const photos = getGallery("adventure");

  return (
    <main id="main">
      {/* The cinematic hero owns its own copy now — it reads the blurb and the
          chapter number straight from navigation.ts, so nothing is passed in
          and nothing can fall out of sync with the nav. */}
      <AdventureHero />

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
