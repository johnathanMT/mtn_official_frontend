import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Cloudinary does the resizing and format negotiation, not Vercel.
     * See src/config/imageLoader.ts for why this is a loaderFile rather than
     * a per-image `loader` prop.
     *
     * Note: with a custom loader, `remotePatterns` and `formats` are not
     * consulted — the URL the loader returns is used verbatim.
     */
    loader: "custom",
    loaderFile: "./src/config/imageLoader.ts",

    /**
     * Next 16 defaults images.qualities to [75] and warns on every render for
     * anything else. NameHero passes quality={82} to its LCP plate, so that
     * warning fired on every page load in development. Declare the values the
     * codebase actually uses.
     */
    qualities: [75, 82],
  },

  /** Talks to the C# .NET backend on Render. */
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001",
  },

  /** R3F / drei ship ESM that Next should compile rather than externalise. */
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],

  /**
   * The parent Desktop folder has its own package-lock from an accidental
   * npm install. Pin Turbopack to this app so it does not walk up and ignore
   * the frontend lockfile.
   */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
