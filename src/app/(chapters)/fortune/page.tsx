import type { Metadata } from "next";
import FortuneHero from "@/components/chapter/FortuneHero";
import FortunePhilosophy from "@/components/chapter/FortunePhilosophy";
import MoonAscendant from "@/components/chapter/MoonAscendant";
import SacredVerse from "@/components/chapter/SacredVerse";
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
  return (
    <main id="main">
      <FortuneHero />

      <FortunePhilosophy />

      <MoonAscendant />

      {/* The scaffold that used to sit here is gone, and so is the getGallery
          call that fed it — an unused `photos` binding would fail lint. When
          the real gallery lands it goes BELOW this banner, with its own id;
          SacredVerse carries `fortune-gallery` because that is the hero's
          Discover target and it should land on something worth landing on. */}
      <SacredVerse />
    </main>
  );
}
