/**
 * ============================================================================
 *  GLOBAL IMAGE LOADER  —  src/config/imageLoader.ts
 * ============================================================================
 *
 *  Wired up in next.config.ts via `images.loaderFile`. Next calls this once
 *  per candidate width to build the `srcset`, so Cloudinary — not Vercel —
 *  does the resizing and format negotiation.
 *
 *  WHY A loaderFile AND NOT THE PER-IMAGE `loader` PROP
 *  ---------------------------------------------------
 *  The `loader` prop takes a function. Server Components cannot pass functions
 *  across the boundary to <Image>, which is a Client Component — doing so
 *  fails the build with "Functions cannot be passed directly to Client
 *  Components". Since every page here is a Server Component, the loader has to
 *  be resolved at build time from a file. That is exactly what loaderFile is
 *  for.
 *
 *  CONSEQUENCE
 *  -----------
 *  A custom loader replaces Next's optimizer GLOBALLY, so local /public files
 *  are no longer resized by Next either — they pass through untouched below.
 *  That is fine while local files are only placeholders; once the photography
 *  lives on Cloudinary this stops mattering entirely.
 *
 *  `remotePatterns` is not consulted on this path, so no Cloudinary entry is
 *  needed in next.config.ts.
 * ============================================================================
 */

import type { ImageLoaderProps } from "next/image";

/* A Cloudinary cloud name is not a secret — it appears in every delivery URL —
   so it is safe to default. The env var still wins if you ever move accounts. */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dhlhzmmtt";

export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  /* Local /public file or an absolute URL — hand it back untouched. */
  if (src.startsWith("/") || /^https?:\/\//i.test(src)) return src;

  /* Everything else is a Cloudinary public ID. Per-asset transformations are
     encoded by imageProps() as "publicId#c_fill,g_auto" — a plain string, so
     it survives the Server → Client boundary that a function would not. */
  const [publicId, extra] = src.split("#");

  if (!CLOUD_NAME) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[imageLoader] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — cannot resolve "${publicId}".`,
      );
    }
    return "/media/brand/placeholder.jpg";
  }

  /* f_auto  → AVIF/WebP where the browser accepts it
     q_auto  → smallest size that still looks right
     c_limit → never upscale past the original */
  const auto = ["f_auto", `q_${quality ?? "auto"}`, "c_limit", `w_${width}`];
  const chain = [extra, auto.join(",")].filter(Boolean).join("/");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${chain}/${publicId}`;
}
