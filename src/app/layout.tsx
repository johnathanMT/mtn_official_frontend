import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from "next/font/google";
import { MEDIA, SITE_URL, toAbsoluteUrl } from "@/config/mediaControl";
import Navbar from "@/components/nav/Navbar";
import "./globals.css";

/* ---------------------------------------------------------------------------
 * FONTS — exposed as CSS variables consumed by @theme in globals.css
 * ------------------------------------------------------------------------ */

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* Used only for the signature slogan in StripeOctagon. Italic 300/400 is the
   elegant end of this family — the weights above it lose the calligraphic
   feel that makes the line read as a hand-set quotation. */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  style: ["italic", "normal"],
});

/* ---------------------------------------------------------------------------
 * SEO + OPEN GRAPH
 * Every image below is pulled from the Media Control Room — never hardcoded.
 * ------------------------------------------------------------------------ */

const SITE_NAME = "Myo Thant Naing";
const SITE_TITLE = "Myo Thant Naing's Official Website";
const SITE_DESCRIPTION =
  "The official website of Myo Thant Naing — a life told in photographs across four chapters: Adventure, Art, Tech and Fortune.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    template: "%s | Myo Thant Naing",
  },
  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  keywords: [
    "Myo Thant Naing",
    "official website",
    "photography",
    "adventure",
    "art",
    "software engineer",
    "astrology",
    "fortune",
  ],

  alternates: {
    canonical: "/",
  },

  /* ---------- Open Graph (Facebook, LinkedIn, WhatsApp, Telegram) ---------- */
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: toAbsoluteUrl(MEDIA.brand.openGraph.src),
        width: MEDIA.brand.openGraph.width,
        height: MEDIA.brand.openGraph.height,
        alt: MEDIA.brand.openGraph.alt,
      },
      {
        url: toAbsoluteUrl(MEDIA.brand.openGraphSquare.src),
        width: MEDIA.brand.openGraphSquare.width,
        height: MEDIA.brand.openGraphSquare.height,
        alt: MEDIA.brand.openGraphSquare.alt,
      },
    ],
  },

  /* ---------- Twitter / X ---------- */
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [toAbsoluteUrl(MEDIA.brand.openGraph.src)],
  },

  /* ---------- Crawling ---------- */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/* ---------------------------------------------------------------------------
 * VIEWPORT — themeColor is the Off-White primary, so mobile browser chrome
 * blends into the page.
 * ------------------------------------------------------------------------ */

export const viewport: Viewport = {
  themeColor: "#F2F2F2",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

/* ---------------------------------------------------------------------------
 * STRUCTURED DATA — helps Google build a rich result for the name.
 * ------------------------------------------------------------------------ */

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE_NAME,
  url: SITE_URL,
  image: toAbsoluteUrl(MEDIA.hero.portrait.src),
  jobTitle: "Software Engineer & Astrologer",
  description: SITE_DESCRIPTION,
};

/* ---------------------------------------------------------------------------
 * ROOT LAYOUT
 * ------------------------------------------------------------------------ */

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="bg-primary text-ink flex min-h-full flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />

        {/* Keyboard users can jump the nav. Visible only on focus. */}
        <a
          href="#main"
          className="bg-accent text-primary sr-only rounded-full px-5 py-3 font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100"
        >
          Skip to content
        </a>

        <Navbar />
        {children}
      </body>
    </html>
  );
}
