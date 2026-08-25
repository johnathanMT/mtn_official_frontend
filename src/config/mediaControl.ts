/**
 * ============================================================================
 *  MEDIA CONTROL ROOM  —  src/config/mediaControl.ts
 * ============================================================================
 *
 *  SINGLE SOURCE OF TRUTH for every image, video, reel and 3D model on
 *  myothantnaing.com — now Cloudinary-aware.
 *
 *  RULE:  UI components must NEVER hardcode a media URL.
 *
 *         import { MEDIA, imageProps } from "@/config/mediaControl";
 *         <Image {...imageProps(MEDIA.hero.portrait)} fill priority />
 *
 *  ---------------------------------------------------------------------------
 *  HOW `src` IS INTERPRETED
 *
 *    "/media/hero/portrait.jpg"     → local file in /public. Served by
 *                                     Next's own optimizer.
 *    "https://…"                    → absolute URL, used verbatim.
 *    "mtn/adventure/everest-01"     → CLOUDINARY PUBLIC ID. Anything that is
 *                                     not a path and not a URL is treated as
 *                                     a Cloudinary asset.
 *
 *  So migrating a photo to Cloudinary is a one-line edit: swap the path for
 *  the public ID. Nothing else in the codebase changes, and local and
 *  Cloudinary assets can coexist during the migration.
 *
 *  ---------------------------------------------------------------------------
 *  SETUP (one time)
 *
 *    .env.local          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *    Vercel → Settings → Environment Variables → same key, all environments.
 *
 *  No npm package is required. No `remotePatterns` entry is required either,
 *  because a custom `loader` bypasses Next's own optimizer entirely.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 * ENVIRONMENT
 * ------------------------------------------------------------------------ */

/** Canonical origin. Override in production via NEXT_PUBLIC_SITE_URL. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://myothantnaing.com";

/** Your Cloudinary cloud name. Empty string = Cloudinary not configured yet. */
export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dhlhzmmtt";

const CLOUDINARY_BASE = "https://res.cloudinary.com";

/* ---------------------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------------------ */

export type MediaCategory =
  | "brand"
  | "hero"
  | "adventure"
  | "art"
  | "tech"
  | "fortune"
  | "reels"
  | "pillar";

export interface ImageAsset {
  /**
   * Local path ("/media/…"), absolute URL, or a Cloudinary public ID
   * ("mtn/adventure/everest-01"). See the header comment.
   */
  src: string;
  /** Required for accessibility and SEO. Describe it, don't caption it. */
  alt: string;
  width?: number;
  height?: number;
  /**
   * Extra Cloudinary transformations, applied BEFORE the automatic
   * format/quality/width ones. Ignored for local files.
   *
   * Useful ones for a portrait-heavy site:
   *   "c_fill,g_auto"        smart crop that keeps the subject centred
   *   "ar_4:5"               force an aspect ratio
   *   "e_improve"            gentle auto colour correction
   */
  transformations?: readonly string[];
  /** Low-res placeholder shown while the full image loads. */
  blurDataURL?: string;
  /** Above-the-fold only — hero images, the logo. */
  priority?: boolean;
}

export interface VideoAsset {
  id: string;
  title: string;
  /** Cloudinary public ID, local path, or an embed URL. */
  src: string;
  poster: ImageAsset;
  provider: "cloudinary" | "local" | "youtube" | "vimeo";
  /** Seconds — used for schema.org markup and UI badges. */
  duration?: number;
  description?: string;
}

export interface ReelAsset {
  id: string;
  src: string;
  poster: ImageAsset;
  caption: string;
  provider: "cloudinary" | "local" | "instagram" | "tiktok" | "youtube";
  permalink?: string;
}

/**
 * A GLB / GLTF on Cloudinary. Never run this through imageProps() —
 * f_auto / q_auto / c_limit would corrupt the binary. Use cloudinaryModelUrl().
 */
export interface ModelAsset {
  /** Cloudinary public ID, no extension. */
  src: string;
  alt: string;
  /**
   * Resource type the file was uploaded under. Cloudinary's Media library
   * defaults 3D files to `image/upload` unless they were posted as raw.
   */
  resourceType?: "image" | "raw";
}

/** One card in the vertical accordion gallery. */
export interface PillarItem extends ImageAsset {
  id: string;
  /** Line one — the place. Shown rotated when the card is collapsed. */
  title: string;
  /** Line two — the mood. Revealed only when the card opens. */
  subtitle: string;
}

export interface GalleryItem extends ImageAsset {
  id: string;
  category: MediaCategory;
  caption?: string;
  /** Drives the masonry grid's row span. */
  aspect?: "square" | "portrait" | "landscape" | "tall";
  year?: number;
}

/* ---------------------------------------------------------------------------
 * SOURCE RESOLUTION
 * ------------------------------------------------------------------------ */

/** Absolute http(s) URL? */
export function isAbsoluteUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** File living in /public? */
export function isLocalPath(src: string): boolean {
  return src.startsWith("/");
}

/** Anything that is neither a path nor a URL is a Cloudinary public ID. */
export function isCloudinary(src: string): boolean {
  return src.length > 0 && !isAbsoluteUrl(src) && !isLocalPath(src);
}

/** Strip any encoded "#c_fill,g_auto" suffix back to the bare public ID. */
export function publicIdOf(src: string): string {
  return src.split("#")[0];
}

/* ---------------------------------------------------------------------------
 * CLOUDINARY URL BUILDERS
 * ------------------------------------------------------------------------ */

interface CloudinaryOptions {
  width?: number;
  /** Cloudinary quality: a number, or "auto" / "auto:best" / "auto:eco". */
  quality?: number | string;
  transformations?: readonly string[];
  resourceType?: "image" | "video";
}

/**
 * Build a delivery URL.
 *
 * `f_auto` serves AVIF/WebP to browsers that accept them, `q_auto` picks a
 * quality that holds up visually at the smallest byte size, and `c_limit`
 * guarantees Cloudinary never upscales past the original.
 */
export function cloudinaryUrl(
  publicId: string,
  {
    width,
    quality = "auto",
    transformations = [],
    resourceType = "image",
  }: CloudinaryOptions = {},
): string {
  if (!CLOUDINARY_CLOUD_NAME) {
    /* Fail loudly in development, quietly in production. A missing cloud name
       is a config mistake, not a runtime condition worth crashing a page for. */
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[mediaControl] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — cannot resolve "${publicId}". Add it to .env.local.`,
      );
    }
    return PLACEHOLDER.src;
  }

  const auto = ["f_auto", `q_${quality}`, "c_limit"];
  if (width) auto.push(`w_${Math.round(width)}`);

  const chain = [...transformations, auto.join(",")].filter(Boolean).join("/");

  return `${CLOUDINARY_BASE}/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${chain}/${publicId}`;
}

/**
 * A tiny, heavily blurred version — 24px wide. Perfect for the blur-up
 * placeholder on a photography-led site.
 *
 * Next accepts a URL here as well as a base64 data URL; it is injected into a
 * CSS background-image, so either works.
 */
export function cloudinaryBlurUrl(publicId: string): string {
  return cloudinaryUrl(publicId, {
    width: 24,
    quality: 30,
    transformations: ["e_blur:800"],
  });
}

/**
 * Cloudinary video delivery URL, with the container format forced by the
 * extension.
 *
 * WHY NOT `f_auto` HERE. Format auto-negotiation relies on the browser's
 * Accept header, which browsers send for images but NOT for <video> requests.
 * Worse, the source is a .mov — a QuickTime container that Chrome and Firefox
 * will not decode at all. Asking Cloudinary for a concrete .webm/.mp4 is what
 * actually makes the reel play; serve both and let the <video> element pick.
 */
export function cloudinaryVideoUrl(
  publicId: string,
  format: "mp4" | "webm",
  transformations: readonly string[] = ["q_auto", "c_limit", "w_1280"],
): string {
  if (!CLOUDINARY_CLOUD_NAME) return "";
  return `${CLOUDINARY_BASE}/${CLOUDINARY_CLOUD_NAME}/video/upload/${transformations.join(",")}/${publicId}.${format}`;
}

/**
 * A still frame from a video, for the <video poster> attribute.
 * `so_0` = seek offset zero, i.e. the first frame.
 */
export function cloudinaryVideoPoster(publicId: string, width = 1280): string {
  if (!CLOUDINARY_CLOUD_NAME) return "";
  return `${CLOUDINARY_BASE}/${CLOUDINARY_CLOUD_NAME}/video/upload/so_0,q_auto,c_limit,w_${width}/${publicId}.jpg`;
}

/**
 * Delivery URL for a GLB. Image transforms are omitted on purpose — a GLB
 * is a binary scene, not a photograph.
 */
export function cloudinaryModelUrl(
  publicId: string,
  {
    format = "glb",
    resourceType = "image",
  }: { format?: "glb" | "gltf"; resourceType?: "image" | "raw" } = {},
): string {
  if (!CLOUDINARY_CLOUD_NAME) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[mediaControl] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — cannot resolve model "${publicId}".`,
      );
    }
    return "";
  }

  return `${CLOUDINARY_BASE}/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${publicId}.${format}`;
}

/* ---------------------------------------------------------------------------
 * NEXT/IMAGE INTEGRATION
 * ------------------------------------------------------------------------ */

interface ImagePropsOptions {
  /**
   * Set when the image should fill its positioned parent (any full-bleed
   * cover). Emits `fill` and OMITS width/height.
   *
   * This is not optional sugar: <Image> throws
   *   "Image with src … has both 'width' and 'fill' properties"
   * if both are present. That assertion only runs in DEVELOPMENT, so a
   * production build and `npm run start` will happily serve a page that
   * crashes the moment someone runs `npm run dev`. Always route `fill`
   * through here rather than passing it alongside a spread.
   */
  fill?: boolean;
  /** Overrides the asset's own priority flag. */
  priority?: boolean;
  /**
   * REPLACES the asset's own transformations for this one render.
   *
   * Use it when the CROP IS A LAYOUT DECISION rather than a property of the
   * photograph — which is the usual case. `c_fill,g_auto` does nothing useful
   * without a target aspect ratio: Cloudinary has no shape to crop to, so it
   * just scales and g_auto never engages. The frame knows its own ratio, so
   * the frame should supply it:
   *
   *   transformations: ["c_fill,g_auto,ar_4:5"]
   *
   * Cloudinary then returns exactly the shape the layout wants, cropped
   * around the detected subject, and ships fewer bytes doing it.
   */
  transformations?: readonly string[];
}

/**
 * Spread onto <Image>. Returns PLAIN SERIALISABLE PROPS ONLY — no functions —
 * so it works unchanged from a Server Component. The actual URL building
 * happens in src/config/imageLoader.ts, wired up globally in next.config.ts.
 *
 *   Intrinsic size (uses the asset's width/height):
 *     <Image {...imageProps(MEDIA.brand.logoDark)} />
 *
 *   Full-bleed (no width/height, `fill` emitted for you):
 *     <Image {...imageProps(MEDIA.hero.portrait, { fill: true })} sizes="100vw" />
 *
 * Per-asset transformations are encoded onto the src as "publicId#c_fill,g_auto"
 * and unpacked by the loader. A string crosses the RSC boundary; a closure
 * would not.
 */
export function imageProps(asset: ImageAsset, options: ImagePropsOptions = {}) {
  const {
    fill = false,
    priority = asset.priority,
    transformations = asset.transformations,
  } = options;
  const cloudinary = isCloudinary(asset.src);

  const src =
    cloudinary && transformations?.length
      ? `${asset.src}#${transformations.join(",")}`
      : asset.src;

  const base = {
    src,
    alt: asset.alt,
    /* width/height and fill are mutually exclusive — never emit both. */
    ...(fill
      ? { fill: true as const }
      : {
          ...(asset.width ? { width: asset.width } : {}),
          ...(asset.height ? { height: asset.height } : {}),
        }),
    ...(priority ? { priority: true } : {}),
  };

  const blurDataURL =
    asset.blurDataURL ??
    (cloudinary ? cloudinaryBlurUrl(publicIdOf(asset.src)) : undefined);

  return blurDataURL
    ? { ...base, placeholder: "blur" as const, blurDataURL }
    : base;
}

/** Fully-qualified URL for an asset — Open Graph rejects relative paths. */
export function toAbsoluteUrl(src: string, base: string = SITE_URL): string {
  if (isAbsoluteUrl(src)) return src;
  if (isCloudinary(src)) return cloudinaryUrl(publicIdOf(src), { width: 1200 });
  return new URL(src, base).toString();
}

/* ---------------------------------------------------------------------------
 * PLACEHOLDER
 * ------------------------------------------------------------------------ */

export const PLACEHOLDER: ImageAsset = {
  src: "/media/brand/placeholder.jpg",
  alt: "Myo Thant Naing",
  width: 1200,
  height: 1200,
};

/* ---------------------------------------------------------------------------
 * THE CONTROL ROOM
 *
 * Every `src` below is still a local placeholder. To go live on Cloudinary,
 * replace the path with the public ID — e.g.
 *     src: "/media/hero/portrait.jpg"
 *  →  src: "mtn/hero/portrait"
 * ------------------------------------------------------------------------ */

export const MEDIA = {
  /* ===================== BRAND ===================== */
  brand: {
    logoDark: {
      src: "/media/brand/logo-dark.svg",
      alt: "Myo Thant Naing monogram",
      width: 160,
      height: 40,
      priority: true,
    } satisfies ImageAsset,

    logoLight: {
      src: "/media/brand/logo-light.svg",
      alt: "Myo Thant Naing monogram",
      width: 160,
      height: 40,
    } satisfies ImageAsset,

    /** 1200×630 — what people see when the site is shared. */
    openGraph: {
      src: "/media/brand/og-image.jpg",
      alt: "Myo Thant Naing — Official Website",
      width: 1200,
      height: 630,
    } satisfies ImageAsset,

    /** Square variant for WhatsApp / Telegram previews. */
    openGraphSquare: {
      src: "/media/brand/og-square.jpg",
      alt: "Myo Thant Naing — Official Website",
      width: 1200,
      height: 1200,
    } satisfies ImageAsset,
  },

  /* ===================== FOOTER ===================== */
  footer: {
    /**
     * Hooded mystic GLB — sits in the closing credit, then launches.
     * Public ID only; cloudinaryModelUrl() appends .glb.
     */
    mystic: {
      src: "v1787680798/retopo_hooded_mystic_figure_3d_model_uljpxa",
      alt: "Hooded mystic figure",
      resourceType: "image",
    } satisfies ModelAsset,
  },

  /* ===================== HERO ===================== */
  hero: {
    portrait: {
      src: "/media/hero/portrait.jpg",
      alt: "Portrait of Myo Thant Naing",
      width: 1400,
      height: 1750,
      priority: true,
    } satisfies ImageAsset,

    /**
     * Optional looping background film. Leave "" and the hero falls back to
     * `backgroundPoster` with a slow Ken Burns drift.
     *
     * For a Cloudinary-hosted loop, use cloudinaryVideoUrl("mtn/hero/loop").
     * Recommended encode: H.264 MP4, 1920×1080, 8–15s seamless, no audio,
     * under ~4 MB so it doesn't hurt Largest Contentful Paint.
     */
    backgroundVideo: "",

    /* The landing hero plate — journey item 01. Swap this src for any other
       public ID to change the whole opening of the site. */
    /* No c_fill here on purpose. The hero fills a viewport whose aspect ratio
       we cannot know, so there is no sensible `ar_` to crop to — and c_fill
       without a target ratio just scales, leaving g_auto inert. object-cover
       does the framing instead. */
    backgroundPoster: {
      src: "v1787211036/watarun_upview_vmmehn",
      alt: "",
      priority: true,
    } satisfies ImageAsset,

    /**
     * Landing hero — stone Jizo GLB. Loaded by HeroJizo3D via useGLTF.
     * Public ID only; the .glb extension is appended by cloudinaryModelUrl().
     */
    jizo: {
      src: "v1787652792/stone_buddhist_statue_3d_model_zvzz7e",
      alt: "Stone Buddhist statue",
      resourceType: "image",
    } satisfies ModelAsset,

    /**
     * Landing hero — golden stupa GLB, sits behind and to the right of the
     * Jizo diorama. Public ID only; cloudinaryModelUrl() appends .glb.
     */
    stupa: {
      src: "v1787667999/Retopo_golden_stupa_3d_model_wrglfb",
      alt: "Golden stupa",
      resourceType: "image",
    } satisfies ModelAsset,
  },

  /* ===================== LANDING =====================
     The two hero assets. Renamed from `futureHero`: the background is no
     longer the forest and the portrait is no longer the AI render, so the old
     name had stopped describing anything. */
  landing: {
    /**
     * Section 1 — full-screen plate behind the name.
     *
     * `ar_16:9` is the fix for the "heavily zoomed in" crop. The section is a
     * wide box; if Cloudinary ships the original (tall) frame, object-cover
     * has to scale it up ~2x to cover, and you see a narrow slice blown up.
     * Delivering an already-wide crop means object-cover barely has to crop at
     * all, so the whole scene reads. `g_auto` picks that wide window around
     * the subject rather than the geometric centre.
     *
     * NOTE: making the section TALLER would make this worse, not better — a
     * taller box needs even more upscaling from a wide source.
     */
    background: {
      src: "v1787224233/five_jiso_uigfwc",
      alt: "",
      transformations: ["c_fill,g_auto,ar_16:9"],
      priority: true,
    } satisfies ImageAsset,

    /* Section 2 — goes inside the octagon. `c_fill,g_auto,ar_1:1` matters:
       the clip path is symmetrical, so a non-square delivery would be cropped
       by CSS into whichever half object-cover happened to favour. g_auto keeps
       the crop on the subject. */
    portrait: {
      src: "v1787219429/IMG_3878_i2nimy",
      alt: "Portrait of Myo Thant Naing",
      transformations: ["c_fill,g_auto,ar_1:1"],
      priority: true,
    } satisfies ImageAsset,

    /**
     * Section 2 — Zawgyi GLB, sits under the hexagon portrait.
     * Public ID only; cloudinaryModelUrl() appends .glb.
     */
    zawgyi: {
      src: "v1787653489/Retopo_zaw_gyi_robe-clad_man_3d_model_gbwmof",
      alt: "Zawgyi, a robe-clad figure from Burmese folklore",
      resourceType: "image",
    } satisfies ModelAsset,
  },

  /* ===================== VIDEO REEL =====================
     Section 4. `video` is a Cloudinary public ID with no extension — the
     format is chosen per <source> by cloudinaryVideoUrl(). */
  reelStory: {
    video: "v1787220143/kyoto_boat_sideview_b99xyl",
    alt: "A traditional boat drifting down the Hozugawa river near Kyoto",
  },

  /* ===================== FULL-BLEED SPLASH REEL =====================
     Section 5. Public ID only — cloudinaryVideoUrl() picks the container per
     <source>, because the upload is a .mov and most browsers cannot decode a
     QuickTime container directly. */
  splashReel: {
    video: "v1787224873/kyoto_splash_boat_zhucfg",
    alt: "A boat crashing through rapids on the Hozugawa river",
  },

  /* ===================== TRAVEL DIARIES =====================
     Section 7. Public IDs only — `f_auto,q_auto` is added by the loader. */
  travel: {
    ikoma: {
      src: "v1787232964/travel_qrqs5i",
      alt: "The cedar ridge of Mount Ikoma looking out over the Nara basin",
      transformations: ["c_fill,g_auto,ar_4:5"],
    } satisfies ImageAsset,

    osakaCollage: {
      src: "v1787232767/Earthy_Neutral_Minimalist_Aesthetic_Photo_Collage_tpdcgx",
      alt: "An earthy collage of Osaka streets, food stalls and evening light",
      transformations: ["c_fill,g_auto,ar_4:5"],
    } satisfies ImageAsset,

    nepaliScrapbook: {
      src: "v1787232789/Polaroid_Scrapbook_Moodboard_Photo_Collage_Facebook_Post_pjzgb0",
      alt: "A polaroid scrapbook from evenings of Nepali food and spice",
      width: 1200,
      height: 1600,
    } satisfies ImageAsset,
  },

  /* ===================== TAROT · DESTINY =====================
     Section 8. Public IDs only — omit .heic / .jpg so f_auto can transcode. */
  tarot: {
    runic: {
      src: "v1787238853/runic_tarrot_x7h7pf",
      alt: "A runic tarot card drawn against dark cloth",
      width: 1200,
      height: 1600,
    } satisfies ImageAsset,

    desk: {
      src: "v1787238839/minitable_tarrot_desk_ks3ov8",
      alt: "A tarot reading laid out on a small table",
      width: 1600,
      height: 1200,
    } satisfies ImageAsset,

    spread: {
      src: "v1787238886/runic_tarrot_spread_dwt8xk",
      alt: "A runic tarot spread laid out in a reading",
      width: 1920,
      height: 1080,
    } satisfies ImageAsset,

    /**
     * Fortune chapter — knight on horseback, sits under the Destiny artwork.
     * Public ID only; cloudinaryModelUrl() appends .glb.
     */
    knight: {
      src: "v1787653209/Retopo_knight_on_horse_3d_model_qv3v1x",
      alt: "Knight on horseback",
      resourceType: "image",
    } satisfies ModelAsset,
  },

  /* ===================== MODERN ART COLLAGE =====================
     Eight stills in a flush 4×4 bento. Public IDs only — object-cover
     does the crop, because each cell has a different aspect. */
  collage: {
    torii: {
      src: "v1787241544/mini_torigate_sqckvu",
      alt: "A miniature torii standing in a quiet shrine courtyard",
    } satisfies ImageAsset,

    still: {
      src: "v1787241470/IMG_9872_2_ftoyro",
      alt: "A raw still from the road",
    } satisfies ImageAsset,

    joso: {
      src: "v1787223065/black_joso_funjng",
      alt: "A street scene from Joso",
    } satisfies ImageAsset,

    indra: {
      src: "v1787222620/indra_watarun_z6z1vn",
      alt: "Indra looking out from Wat Arun at dusk",
    } satisfies ImageAsset,

    bikeShadow: {
      src: "v1787244435/mtn_bikeshadow_zuzn9i",
      alt: "A bicycle throwing a long shadow",
    } satisfies ImageAsset,

    osakaSky: {
      src: "v1787244317/osaka_sky_j4nnty",
      alt: "Osaka skyline against an open sky",
    } satisfies ImageAsset,

    lotus: {
      src: "v1787245088/lotus_b9kfpa",
      alt: "A lotus in still water",
    } satisfies ImageAsset,

    gadotpwal: {
      src: "v1787244338/gadotpwal_tpmtpd",
      alt: "A still from the road at Gadotpwal",
    } satisfies ImageAsset,
  },

  /* ===================== DEVELOPER PORTAL =====================
     Airplane-window gateway to myothant.dev. Tall 3:4 crop. */
  portal: {
    src: "v1787232481/Blue_Futuristic_Artificial_Intelligence_Instagram_Post_xjvxyd",
    alt: "A glowing gateway to the developer portal at myothant.dev",
    transformations: ["c_fill,g_auto,ar_3:4"],
  } satisfies ImageAsset,

  /* ===================== PILLAR GALLERY =====================
     Six vertical cards. Order here is the order on screen.

     EXTENSIONS ARE DELIBERATELY OMITTED. Your URLs end in .heic / .jpg, but
     that is the DELIVERY format, not part of the public ID. Leaving it off
     lets `f_auto` — added to every request by src/config/imageLoader.ts —
     transcode HEIC to AVIF or WebP per browser. Hardcoding ".heic" would ask
     browsers to decode a format most of them cannot display.

     React keys come from `id`, never `src`: if two entries ever point at the
     same image again, keying on src would collapse them into one card. */
  pillars: [
    {
      id: "p-01",
      src: "v1787211036/watarun_upview_vmmehn",
      alt: "Looking up at the spires of Wat Arun",
      title: "Wat Arun",
      subtitle: "The Upward Gaze",
    },
    {
      id: "p-02",
      src: "v1787210905/shimsanda_jinja_entrance_x0tkyv",
      alt: "The entrance gate of a Shinto shrine",
      title: "Jinja Shrine",
      subtitle: "Traditional Gate",
    },
    {
      id: "p-03",
      src: "v1787211120/kyoto_river_w06fgv",
      alt: "A river running through Kyoto",
      title: "Kyoto",
      subtitle: "Serene Waters",
    },
    {
      id: "p-04",
      src: "v1787215139/mtn_forest_i3xmbl",
      alt: "Sunlight through a dense forest",
      title: "Serene Forest",
      subtitle: "Into the Wild",
    },
    {
      id: "p-05",
      src: "v1787215714/circle_tarrot_ra3nu6",
      alt: "Tarot cards laid out in a circle",
      title: "Tarot Circle",
      subtitle: "Reading the Signs",
    },
    {
      id: "p-06",
      src: "v1787217679/mtn_desktop_red_ahibci",
      alt: "A desk workspace lit in red",
      title: "The Desk",
      subtitle: "Where It Is Built",
    },
  ] satisfies PillarItem[],

  /* ===================== THE JOURNEY =====================
     The landing page sequence. Item 0 is the full-screen hero; the rest fall
     into the asymmetric grid below it, in this order.

     These are Cloudinary PUBLIC IDS, not URLs — the version prefix
     ("v1787211036/") is included so each entry always resolves to the exact
     asset you uploaded, and CDN caches can treat it as immutable.

     .heic SOURCES: no manual extension change is needed. `f_auto` (added by
     src/config/imageLoader.ts on every request) makes Cloudinary transcode
     HEIC to AVIF or WebP based on what the browser accepts, which is both
     more correct and smaller than forcing .jpg. If one ever fails to render,
     see the note at the bottom of this file.

     `c_fill,g_auto` is on every item deliberately: these are phone photos of
     unknown orientation, and g_auto lets Cloudinary pick the crop around the
     actual subject rather than the geometric centre, so a portrait shot still
     works inside a landscape frame.

     ALT TEXT IS A BEST GUESS from your filenames — please correct it. */
  journey: [
    {
      id: "j-01",
      category: "adventure",
      src: "v1787211036/watarun_upview_vmmehn",
      alt: "Looking up at the spires of Wat Arun against the sky",
      caption: "Looking up",
      aspect: "portrait",
      transformations: ["c_fill,g_auto"],
      priority: true,
    },
    {
      id: "j-02",
      category: "adventure",
      src: "v1787210905/shimsanda_jinja_entrance_x0tkyv",
      alt: "The torii gate at the entrance to a Shinto shrine",
      caption: "The gate",
      aspect: "portrait",
      transformations: ["c_fill,g_auto"],
    },
    {
      id: "j-03",
      category: "art",
      src: "v1787210918/IMG_5330_jhajcl",
      alt: "A moment from the journey",
      caption: "Unplanned",
      aspect: "landscape",
      transformations: ["c_fill,g_auto"],
    },
    {
      id: "j-04",
      category: "adventure",
      src: "v1787210874/mtn_osaka_tower_lxvbdy",
      alt: "Myo Thant Naing photographed at a tower in Osaka",
      caption: "Osaka",
      aspect: "portrait",
      transformations: ["c_fill,g_auto"],
    },
    {
      id: "j-05",
      category: "adventure",
      src: "v1787211124/two_bike_ssym_mm452g",
      alt: "Two bicycles parked side by side",
      caption: "Two wheels",
      aspect: "landscape",
      transformations: ["c_fill,g_auto"],
    },
  ] satisfies GalleryItem[],

  /* ===================== CHAPTER COVERS =====================
     One full-bleed image per life chapter — these drive both the landing
     page's pinned chapters and each route's page header. */
  chapters: {
    about: {
      src: "/media/hero/portrait.jpg",
      alt: "Portrait of Myo Thant Naing",
      width: 1400,
      height: 1750,
      transformations: ["c_fill,g_auto"],
    } satisfies ImageAsset,

    adventure: {
      src: "/media/chapters/adventure.jpg",
      alt: "Myo Thant Naing on an expedition",
      width: 1600,
      height: 900,
      transformations: ["c_fill,g_auto"],
    } satisfies ImageAsset,

    art: {
      src: "/media/chapters/art.jpg",
      alt: "A piece of visual art by Myo Thant Naing",
      width: 1600,
      height: 900,
      transformations: ["c_fill,g_auto"],
    } satisfies ImageAsset,

    tech: {
      src: "/media/chapters/tech.jpg",
      alt: "Myo Thant Naing working on a software project",
      width: 1600,
      height: 900,
      transformations: ["c_fill,g_auto"],
    } satisfies ImageAsset,

    fortune: {
      src: "/media/chapters/fortune.jpg",
      alt: "Astrological chart artwork",
      width: 1600,
      height: 900,
      transformations: ["c_fill,g_auto"],
    } satisfies ImageAsset,
  },

  /* ===================== GALLERY ===================== */
  gallery: [
    {
      id: "g-001",
      category: "adventure",
      src: "/media/gallery/photo-01.jpg",
      alt: "Myo Thant Naing at altitude on a mountain expedition",
      caption: "On the ridge",
      aspect: "landscape",
      width: 1600,
      height: 1067,
      year: 2026,
    },
    {
      id: "g-002",
      category: "art",
      src: "/media/gallery/photo-02.jpg",
      alt: "Studio portrait of Myo Thant Naing",
      caption: "Studio session",
      aspect: "portrait",
      width: 1067,
      height: 1600,
      year: 2026,
    },
    {
      id: "g-003",
      category: "tech",
      src: "/media/gallery/photo-03.jpg",
      alt: "Close-up of code on a monitor",
      caption: "Behind the build",
      aspect: "square",
      width: 1400,
      height: 1400,
      year: 2025,
    },
  ] satisfies GalleryItem[],

  /* ===================== LONG-FORM VIDEO ===================== */
  videos: [
    {
      id: "v-001",
      title: "Building at the intersection of technology and tradition",
      src: "/media/videos/feature-01.mp4",
      provider: "local",
      duration: 184,
      description: "A short film on the philosophy behind the work.",
      poster: {
        src: "/media/videos/feature-01-poster.jpg",
        alt: "Title frame of the feature film",
        width: 1920,
        height: 1080,
      },
    },
  ] satisfies VideoAsset[],

  /* ===================== VERTICAL REELS (9:16) ===================== */
  reels: [
    {
      id: "r-001",
      src: "/media/reels/reel-01.mp4",
      caption: "Three minutes on Mercury retrograde — the practical version",
      provider: "local",
      poster: {
        src: "/media/reels/reel-01-poster.jpg",
        alt: "Opening frame of the reel",
        width: 1080,
        height: 1920,
      },
    },
    {
      id: "r-002",
      src: "/media/reels/reel-02.mp4",
      caption: "Shipping a .NET API to production in one sitting",
      provider: "local",
      poster: {
        src: "/media/reels/reel-02-poster.jpg",
        alt: "Opening frame of the reel",
        width: 1080,
        height: 1920,
      },
    },
  ] satisfies ReelAsset[],
} as const;

/* ---------------------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------------------ */

/** All gallery items, optionally narrowed to one chapter. */
export function getGallery(category?: MediaCategory): readonly GalleryItem[] {
  if (!category) return MEDIA.gallery;
  return MEDIA.gallery.filter((item) => item.category === category);
}

export function getVideo(id: string): VideoAsset | undefined {
  return MEDIA.videos.find((v) => v.id === id);
}

export function getReel(id: string): ReelAsset | undefined {
  return MEDIA.reels.find((r) => r.id === id);
}

/** Returns PLACEHOLDER when an asset is missing or its src is empty. */
export function safeImage(asset?: ImageAsset | null): ImageAsset {
  if (!asset?.src) return PLACEHOLDER;
  return asset;
}

/* ---------------------------------------------------------------------------
 * THE JOURNEY — typed accessor
 * ------------------------------------------------------------------------ */

/** The full landing-page sequence, hero first. */
export function getJourney(): readonly GalleryItem[] {
  return MEDIA.journey;
}

/** Everything after the hero — what the asymmetric grid renders. */
export function getJourneyGrid(): readonly GalleryItem[] {
  return MEDIA.journey.slice(1);
}

/* ---------------------------------------------------------------------------
 * TROUBLESHOOTING HEIC
 *
 * `f_auto` handles HEIC on every current Cloudinary plan. If an image ever
 * comes back broken, force a concrete format by appending an extension to the
 * public ID in this file:
 *
 *     src: "v1787211036/watarun_upview_vmmehn.jpg"
 *
 * That asks Cloudinary to transcode to JPEG unconditionally. It always works,
 * but costs you AVIF/WebP — so only reach for it if f_auto genuinely fails.
 * ------------------------------------------------------------------------ */

/** The six vertical accordion cards, in display order. */
export function getPillars(): readonly PillarItem[] {
  return MEDIA.pillars;
}
