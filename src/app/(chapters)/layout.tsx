/**
 * Shared chrome for every chapter route: Adventure, Art, Tech, Fortune, About.
 *
 * The back pill is an overlay so it sits at the top left of the hero without
 * being copied into each page.tsx. The footer is a sibling of <main>, matching
 * the home page — never nested inside it.
 */

import BackToHome from "@/components/chapter/BackToHome";
import PremiumFooter from "@/components/layout/PremiumFooter";

export default function ChaptersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 pt-24 lg:pt-28">
          <div className="container-premium pointer-events-auto">
            <BackToHome />
          </div>
        </div>
        {children}
      </div>
      <PremiumFooter />
    </>
  );
}
