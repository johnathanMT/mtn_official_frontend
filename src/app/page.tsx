/**
 * ============================================================================
 *  HOME — src/app/page.tsx
 * ============================================================================
 *
 *  Strict top-to-bottom order. Nothing else lives on this page.
 *
 *    1. NameHero          full-screen 3D plate, compact name top-left
 *    2. ProfileSection    dark grey grid, hexagon portrait
 *    3. PillarGallery     six vertical accordion cards, full width
 *    4. VideoReelStory    beige band — Hozugawa reflection + looping reel
 *    5. FullSplashReel    full-bleed rapids clip + mossy inverted pyramid
 *    6. TravelDiaries     Ikoma / Osaka stills, then a Nepali scrapbook
 *    7. BurmeseWordCloud  navy proverb cluster — shares a canvas with 8
 *    8. TarotDestiny      runic card, desk, full-bleed spread
 *    9. ModernArtCollage  torn-paper stills, stacked like magazine clippings
 *   10. DeveloperPortal   airplane-window gateway to myothant.dev
 *   11. PremiumFooter     near-black slab: slogan, grid, hairline, copyright
 *
 *  A Server Component: every child is a client component that manages its own
 *  motion, so this file ships no JavaScript of its own.
 *
 *  Every image resolves from src/config/mediaControl.ts — no URLs here.
 * ============================================================================
 */

import NameHero from "@/components/hero/NameHero";
import ProfileSection from "@/components/sections/ProfileSection";
import PillarGallery from "@/components/gallery/PillarGallery";
import VideoReelStory from "@/components/story/VideoReelStory";
import FullSplashReel from "@/components/story/FullSplashReel";
import BurmeseWordCloud from "@/components/ui/BurmeseWordCloud";
import TravelDiaries from "@/components/sections/TravelDiaries";
import TarotDestiny from "@/components/sections/TarotDestiny";
import ModernArtCollage from "@/components/sections/ModernArtCollage";
import DeveloperPortal from "@/components/ui/DeveloperPortal";
import PremiumFooter from "@/components/layout/PremiumFooter";

export default function Home() {
  return (
    <>
      <main id="main">
        <NameHero />
        <ProfileSection />
        <PillarGallery />
        <VideoReelStory />
        <FullSplashReel />
        <TravelDiaries />
        <div className="bg-secondary-900">
          <BurmeseWordCloud />
          <TarotDestiny />
        </div>
        <ModernArtCollage />
        <DeveloperPortal />
      </main>

      <PremiumFooter />
    </>
  );
}
