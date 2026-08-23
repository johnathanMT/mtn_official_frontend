"use client";

/**
 * ============================================================================
 *  NAVBAR — sticky overlay → glassmorphism on scroll
 * ============================================================================
 *
 *  Two visual states:
 *
 *    TRANSPARENT — only on routes that open with a full-bleed dark image
 *      (see ROUTES_WITH_DARK_HERO). Ivory text, no border, no background:
 *      the bar disappears into the photograph.
 *
 *    GLASS — past NAV_GLASS_THRESHOLD, and immediately on any route without
 *      a dark hero. Translucent Primary + backdrop blur + saturation, a
 *      hairline border and a soft shadow. Text flips to ink.
 *
 *  That route check matters: a transparent bar with ivory text on an ivory
 *  page renders an invisible navigation.
 *
 *  The Crimson "Contact" pill never changes between states — it is the site's
 *  10% accent anchor and should read identically everywhere.
 *
 *  Labels and hrefs come from src/config/navigation.ts, never from here.
 * ============================================================================
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  type Variants,
} from "motion/react";
import {
  BRAND,
  getChapterNumber,
  hasDarkHero,
  NAV_CTA,
  NAV_GLASS_THRESHOLD,
  NAV_LINKS,
} from "@/config/navigation";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------------------------------------------------------------------
 * MOBILE OVERLAY MOTION
 * ------------------------------------------------------------------------ */

const panel: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: EASE,
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
  exit: { opacity: 0, transition: { duration: 0.28, ease: EASE } },
};

const panelItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } },
};

/* ---------------------------------------------------------------------------
 * SCROLL STATE
 *
 * Read through useSyncExternalStore rather than useEffect + setState. A
 * setState inside an effect body triggers a cascading render (React 19 lints
 * against it), and a lazy useState initialiser reading window.scrollY would
 * desync from the server-rendered HTML and cause a hydration mismatch.
 * useSyncExternalStore handles both — getServerSnapshot returns the SSR value.
 * ------------------------------------------------------------------------ */

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolled = () => window.scrollY > NAV_GLASS_THRESHOLD;

/** On the server the page is always at the top. */
const getScrolledServer = () => false;

/* ---------------------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------------------ */

export default function Navbar() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();

  /**
   * The overlay must close whenever the route changes — otherwise a browser
   * back/forward navigates underneath a menu still covering the screen.
   *
   * Rather than an effect that watches `pathname` and calls setState (which
   * React 19 lints as a cascading render), we store WHICH path the menu was
   * opened on and derive openness from it. A route change closes the menu for
   * free, with no effect and no extra render.
   */
  const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
  const menuOpen = openedOnPath === pathname;

  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrolled,
    getScrolledServer,
  );

  const closeMenu = useCallback(() => setOpenedOnPath(null), []);
  const toggleMenu = useCallback(
    () =>
      setOpenedOnPath((current) => (current === pathname ? null : pathname)),
    [pathname],
  );

  /* Lock scroll and wire Escape while the overlay is open. This one IS a
     legitimate effect: it synchronises an external system (document.body). */
  useEffect(() => {
    if (!menuOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedOnPath(null);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  /* Glass whenever we're scrolled, OR the route has no dark hero to sit on.
     Never while the dark mobile overlay is open — an ivory bar with ink text
     on top of that overlay is unreadable. */
  const glassed = (scrolled || !hasDarkHero(pathname)) && !menuOpen;

  /* NOTE: these must be complete, literal class strings. Tailwind scans the
     source as plain text, so a constructed name like `hover:${tone}` is never
     generated and the style silently goes missing. */
  const textTone = glassed ? "text-ink" : "text-primary";
  const linkIdle = glassed
    ? "text-ink-muted hover:text-ink"
    : "text-primary/75 hover:text-primary";
  const linkActive = glassed ? "text-ink" : "text-primary";

  return (
    <>
      <motion.header
        initial={prefersReducedMotion ? false : { y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        className={[
          "fixed inset-x-0 top-0 z-50 border-b",
          "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-out",
          glassed
            ? "bg-primary/80 border-hairline shadow-soft backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-transparent",
        ].join(" ")}
      >
        <nav
          aria-label="Primary"
          className="container-premium flex h-16 items-center justify-between gap-6 lg:h-20"
        >
          {/* ---------------- LOGO ---------------- */}
          <Link
            href={BRAND.href}
            onClick={closeMenu}
            className={`group flex shrink-0 items-baseline gap-2 transition-colors duration-500 ${textTone}`}
          >
            <span className="font-display text-lg leading-none font-medium tracking-[-0.01em] sm:text-xl">
              <span className="hidden sm:inline">Myo Thant </span>
              <span className="sm:hidden">{BRAND.short}</span>
              <span className="hidden italic sm:inline">Naing</span>
            </span>
            <span
              aria-hidden="true"
              className="bg-accent h-1 w-1 shrink-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </Link>

          {/* ---------------- DESKTOP LINKS ---------------- */}
          <ul className="hidden items-center gap-6 md:flex xl:gap-9">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative block py-1 text-sm font-medium tracking-wide whitespace-nowrap transition-colors duration-300 ${
                      isActive ? linkActive : linkIdle
                    }`}
                  >
                    {link.label}
                    {/* Crimson underline: grows on hover, latched when active */}
                    <span
                      aria-hidden="true"
                      className={`bg-accent absolute -bottom-0.5 left-0 h-px w-full origin-left transition-transform duration-500 ease-out ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ---------------- RIGHT SIDE ---------------- */}
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={NAV_CTA.href}
              className="bg-accent text-primary hover:bg-accent-600 hover:shadow-accent hidden rounded-full px-6 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5 sm:inline-flex"
            >
              {NAV_CTA.label}
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={`relative -mr-2 flex h-11 w-11 items-center justify-center transition-colors duration-500 md:hidden ${textTone}`}
            >
              <span aria-hidden="true" className="relative block h-3 w-6">
                <span
                  className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-300 ease-out ${
                    menuOpen ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-300 ease-out ${
                    menuOpen ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>

        {/* ---------------- SCROLL PROGRESS ----------------
            A one-pixel crimson reading indicator.

            Gated on `scrolled`, not on `glassed`. On a page too short to
            scroll, scrollYProgress sits at 1, so gating on `glassed` would
            paint a full-width crimson rule under the bar on every short
            route — reading as a design element rather than as progress. */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: scrollYProgress }}
          className={`bg-accent absolute inset-x-0 bottom-0 h-px origin-left transition-opacity duration-500 ${
            glassed && scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </motion.header>

      {/* ---------------- MOBILE OVERLAY ---------------- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-secondary-950/95 fixed inset-0 z-40 flex flex-col justify-center backdrop-blur-2xl md:hidden"
          >
            <nav aria-label="Mobile" className="container-premium">
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <motion.li key={link.href} variants={panelItem}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="text-primary group flex items-baseline gap-4 py-2.5"
                    >
                      <span className="text-accent-300 font-mono text-xs">
                        {getChapterNumber(link.href).en}
                      </span>
                      <span
                        className={`font-display text-4xl leading-tight font-medium transition-transform duration-300 group-hover:translate-x-1 ${
                          pathname === link.href ? "italic" : ""
                        }`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.div variants={panelItem} className="mt-10">
                <Link
                  href={NAV_CTA.href}
                  onClick={closeMenu}
                  className="bg-accent text-primary hover:bg-accent-600 inline-flex w-full items-center justify-center rounded-full px-8 py-4 font-medium transition-colors duration-300"
                >
                  {NAV_CTA.label}
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
