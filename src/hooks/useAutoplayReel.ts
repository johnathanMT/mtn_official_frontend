"use client";

/**
 * ============================================================================
 *  useAutoplayReel — make a background <video> actually autoplay
 * ============================================================================
 *
 *  Muted autoplay is more fragile than it looks. Four separate things have to
 *  go right, and the first version of the splash reel got two of them wrong:
 *
 *  1. NEVER PAUSE BEFORE THE FIRST SUCCESSFUL PLAY.
 *     The old code paused the element as soon as the component mounted,
 *     because its in-view flag starts out false and only flips once the
 *     observer fires. That pause landed in the middle of the browser's own
 *     autoplay attempt and cancelled it. `startedRef` here means we only ever
 *     pause a clip that has genuinely been playing.
 *
 *  2. play() RETURNS A PROMISE THAT REJECTS, AND THE REJECTION MATTERS.
 *     It rejects when autoplay is blocked, and also with AbortError when the
 *     element does not yet hold enough data. The old code did
 *     `.catch(() => {})` — so a blocked reel looked identical to a working
 *     one and failed in total silence. Here a rejection is retried once the
 *     media reports it can play, and if it still will not start we surface
 *     `needsTap` so the UI can offer a control instead of a dead poster.
 *
 *  3. `muted` MUST BE TRUE AS A PROPERTY, not only as an attribute.
 *     Set explicitly below; cheap insurance across engines.
 *
 *  4. OFF-SCREEN CLIPS SHOULD STOP.
 *     Two clips decoding at once costs real CPU and battery.
 *
 *  Uses a plain IntersectionObserver rather than Motion's `useInView` on
 *  purpose: we need to act only on real observer callbacks, never on the
 *  "false until proven otherwise" initial render that caused problem 1.
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface AutoplayReel {
  /** Attach to the <video>. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** True when the browser refused to start it — show a play control. */
  needsTap: boolean;
  /** Wire to that control's onClick; counts as a user gesture. */
  play: () => void;
}

export function useAutoplayReel(enabled: boolean): AutoplayReel {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startedRef = useRef(false);
  const [needsTap, setNeedsTap] = useState(false);

  /** Exposed for a tap-to-play control — a real user gesture always wins. */
  const play = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    void el
      .play()
      .then(() => {
        startedRef.current = true;
        setNeedsTap(false);
      })
      .catch(() => setNeedsTap(true));
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    /* Reduced motion: leave it on the poster and let the controls do the work. */
    if (!enabled) {
      el.pause();
      return;
    }

    /* Property, not just the attribute. */
    el.muted = true;
    el.defaultMuted = true;

    let cancelled = false;

    const attempt = () => {
      if (cancelled) return;
      void el
        .play()
        .then(() => {
          startedRef.current = true;
          setNeedsTap(false);
        })
        .catch(() => {
          /* Two different failures land here: genuinely blocked autoplay, and
             "not enough data yet". The `canplay` listener below covers the
             second; if neither ever succeeds the control appears. */
          if (!startedRef.current) setNeedsTap(true);
        });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          attempt();
        } else if (startedRef.current) {
          /* Only ever pause something that actually started — see note 1. */
          el.pause();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    el.addEventListener("canplay", attempt);
    el.addEventListener("loadeddata", attempt);

    return () => {
      cancelled = true;
      observer.disconnect();
      el.removeEventListener("canplay", attempt);
      el.removeEventListener("loadeddata", attempt);
    };
  }, [enabled]);

  return { videoRef, needsTap, play };
}
