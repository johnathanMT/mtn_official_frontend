"use client";

/**
 * Client mount for the Art coastline. `ssr: false` is illegal from the Art
 * Server Component, so this file is the boundary — same pattern as NameHero.
 */

import dynamic from "next/dynamic";

const ArtLonelinessScene = dynamic(() => import("./ArtLonelinessScene"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[86svh] w-full bg-[#05070f]"
      aria-hidden="true"
    />
  ),
});

export default function ArtLonelinessMount() {
  return (
    <section
      aria-label="A desert meeting a calm sea — a solitary figure at the trees"
      className="relative bg-[#05070f]"
    >
      <ArtLonelinessScene className="h-[86svh] w-full lg:h-svh" />
    </section>
  );
}
