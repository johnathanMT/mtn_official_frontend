"use client";

/**
 * ============================================================================
 *  DEVELOPER PORTAL — section 9
 * ============================================================================
 *
 *  Copy on the left, airplane-window gateway on the right. A slow-floating
 *  arrow sits on the window's axis and points into it. The window is the
 *  only click target — the paragraph tells you where it leads; the porthole
 *  is how you go.
 *
 *  The href lives in src/config/navigation.ts. The image lives in
 *  src/config/mediaControl.ts.
 * ============================================================================
 */

import Image from "next/image";
import Link from "next/link";
import { ChevronsDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { MEDIA, imageProps } from "@/config/mediaControl";
import { DEVELOPER_PORTAL } from "@/config/navigation";

const COPY = {
  eyebrow: "The Engineering Frontier",
  heading: "The Architecture Behind the Art.",
  body: "Step into the engineering frontier. Click the portal to explore my developer portfolio, AI engineering projects, and system architectures.",
} as const;

export default function DeveloperPortal() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="portal"
      aria-label="Developer portal"
      className="bg-secondary-950 relative isolate overflow-hidden py-24 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(38% 58% at 82% 50%, rgb(23 169 224 / 0.32) 0%, transparent 70%)",
        }}
      />

      <div className="container-premium flex flex-col items-center justify-between gap-8 md:flex-row md:gap-12 lg:gap-16">
        {/* ---------------- LEFT · INVITATION ---------------- */}
        <div className="max-w-xl text-center md:text-left">
          <div className="flex items-center justify-center gap-4 md:justify-start">
            <span
              aria-hidden="true"
              className="bg-electric/70 h-px w-10 shrink-0"
            />
            <span className="text-electric-glow text-[0.65rem] font-semibold tracking-[0.22em] uppercase">
              {COPY.eyebrow}
            </span>
          </div>

          <h2 className="text-primary font-display mt-6 text-[clamp(1.85rem,4vw,2.85rem)] leading-[1.1] font-medium tracking-[-0.02em]">
            {COPY.heading}
          </h2>

          <p className="text-sand-200/90 font-script mt-6 text-[clamp(1.15rem,1.8vw,1.45rem)] leading-[1.65] text-pretty italic">
            {COPY.body}
          </p>
        </div>

        {/* ---------------- RIGHT · PORTAL ---------------- */}
        <div className="mr-0 flex shrink-0 flex-col items-center sm:mr-8">
          {/* whileInView, not animate. An `animate` loop with repeat: Infinity
              runs for the entire life of the page — Motion keeps a rAF callback
              alive whether or not the section is anywhere near the screen, and
              this section is the tenth of eleven. whileInView with once:false
              starts it on arrival and stops it on the way out, which on a
              mid-range phone is the difference between a permanent background
              cost and one that only exists while it is being looked at. */}
          <motion.div
            aria-hidden="true"
            initial={false}
            whileInView={reduceMotion ? undefined : { y: [0, 10, 0] }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="mb-4"
          >
            <ChevronsDown
              strokeWidth={1.5}
              className="text-electric-glow h-8 w-8 drop-shadow-[0_0_10px_rgb(95_216_255/0.7)]"
            />
          </motion.div>

          <Link
            href={DEVELOPER_PORTAL.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group focus-visible:outline-none"
          >
            <motion.div
              whileHover={reduceMotion ? undefined : { scale: 1.05 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="flex flex-col items-center gap-7"
            >
              <div className="relative w-44 sm:w-52 lg:w-64">
                <div
                  aria-hidden="true"
                  className="bg-electric/50 absolute inset-0 -z-10 scale-125 blur-3xl"
                />

                <div className="shadow-electric from-electric-glow via-electric to-electric-deep relative aspect-3/4 overflow-hidden rounded-t-[8rem] rounded-b-[3rem] bg-linear-to-b p-1 transition-shadow duration-500 group-hover:shadow-[0_0_0_1px_rgb(95_216_255/0.55),0_0_36px_rgb(23_169_224/0.7),0_0_110px_rgb(23_169_224/0.4)]">
                  <div className="bg-secondary-950 relative h-full w-full overflow-hidden rounded-t-[7.6rem] rounded-b-[2.7rem]">
                    <Image
                      {...imageProps(MEDIA.portal, { fill: true })}
                      alt={MEDIA.portal.alt}
                      sizes="(min-width: 1024px) 16rem, (min-width: 640px) 13rem, 11rem"
                      className="object-cover transition-transform duration-700 ease-premium group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-[12%] top-[8%] h-1/5 rounded-full bg-linear-to-b from-white/25 to-transparent"
                    />
                  </div>
                </div>
              </div>

              <span className="text-primary/85 group-hover:text-electric-glow font-sans text-[0.7rem] font-semibold tracking-[0.22em] uppercase transition-colors duration-300">
                {DEVELOPER_PORTAL.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </span>
            </motion.div>
          </Link>
        </div>
      </div>
    </section>
  );
}
