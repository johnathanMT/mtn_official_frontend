"use client";

/**
 * Fortune-only footer mystic.
 *
 * The Canvas stays in the slot at a fixed size. Launch is a CSS translate
 * on a wrapper — never position:fixed, never a second canvas, never a well
 * that changes page height. Home is always: transform none, face forward.
 */

import * as React from "react";
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import { Box3, Group, Vector3, type Object3D } from "three";
import { MEDIA, cloudinaryModelUrl } from "@/config/mediaControl";

const URL = cloudinaryModelUrl(MEDIA.footer.mystic.src, {
  resourceType: MEDIA.footer.mystic.resourceType,
});

const GOLD = "#CFB53B";
const MAROON = "#5E0B15";
const SPIN_SECONDS = 0.42;
const WHIRL_SPEED = 18;
const TWO_PI = Math.PI * 2;
const SLOT_BOX = "h-52 w-full max-w-54 sm:h-60";

type MysticCtx = {
  enabled: boolean;
  flying: boolean;
  busy: boolean;
  reducedMotion: boolean;
  turns: number;
  whirl: boolean;
  wrapRef: RefObject<HTMLDivElement | null>;
  launch: () => void;
};

const FooterMysticContext = createContext<MysticCtx | null>(null);

function useMystic() {
  const ctx = useContext(FooterMysticContext);
  if (!ctx) {
    throw new Error("Footer mystic is missing its provider");
  }
  return ctx;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function animateY(
  el: HTMLElement,
  fromY: number,
  toY: number,
  duration: number,
  ease: (t: number) => number,
) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const y = fromY + (toY - fromY) * ease(t);
      el.style.transform = `translate3d(0, ${y}px, 0)`;
      if (t < 1) window.requestAnimationFrame(tick);
      else {
        el.style.transform = toY === 0 ? "" : `translate3d(0, ${toY}px, 0)`;
        resolve();
      }
    };
    window.requestAnimationFrame(tick);
  });
}

const easeIn = (t: number) => t * t * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function clearFlight(el: HTMLElement | null) {
  if (!el) return;
  el.style.transform = "";
  el.style.zIndex = "";
  el.style.position = "";
  el.style.left = "";
  el.style.top = "";
  el.style.width = "";
  el.style.height = "";
  el.style.margin = "";
  el.style.pointerEvents = "";
}

function useNativeBox(scene: Object3D) {
  return useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const safe = (v: number) => (Number.isFinite(v) ? Math.max(v, 0.001) : 1);
    return { width: safe(size.x), height: safe(size.y), depth: safe(size.z) };
  }, [scene]);
}

function MysticModel({
  turns,
  whirl,
  reducedMotion,
}: {
  turns: number;
  whirl: boolean;
  reducedMotion: boolean;
}) {
  const { scene } = useGLTF(URL, true, true);
  const object = useMemo(() => scene.clone(true), [scene]);
  const native = useNativeBox(object);
  const spin = useRef<Group>(null);
  const yaw = useRef(0);
  const from = useRef(0);
  const to = useRef(0);
  const progress = useRef(1);
  const primed = useRef(false);
  const prevWhirl = useRef(whirl);

  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);
  const scale = useMemo(() => {
    if (size.width <= 0 || size.height <= 0) return 1;
    return Math.min(
      (viewport.width * 0.9) / native.width,
      (viewport.height * 0.9) / native.height,
    );
  }, [native.height, native.width, size.height, size.width, viewport.height, viewport.width]);

  useEffect(() => {
    const next = turns * TWO_PI;
    if (reducedMotion) {
      yaw.current = next;
      to.current = next;
      progress.current = 1;
      primed.current = true;
      if (spin.current) spin.current.rotation.y = next;
      return;
    }
    if (!primed.current) {
      primed.current = true;
      if (turns === 0) {
        yaw.current = 0;
        to.current = 0;
        progress.current = 1;
        return;
      }
    }
    from.current = yaw.current;
    to.current = next;
    progress.current = 0;
  }, [reducedMotion, turns]);

  useEffect(() => {
    if (prevWhirl.current && !whirl) {
      const normalized = ((yaw.current % TWO_PI) + TWO_PI) % TWO_PI;
      from.current = yaw.current;
      to.current = yaw.current - (normalized > Math.PI ? normalized - TWO_PI : normalized);
      progress.current = 0;
    }
    prevWhirl.current = whirl;
  }, [whirl]);

  useFrame((_, delta) => {
    const node = spin.current;
    if (!node) return;
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta / SPIN_SECONDS);
      const k = 1 - Math.pow(1 - progress.current, 3);
      yaw.current = from.current + (to.current - from.current) * k;
    } else if (whirl) {
      yaw.current += delta * WHIRL_SPEED;
    } else {
      yaw.current = to.current;
    }
    node.rotation.y = yaw.current;
  });

  return (
    <Center cacheKey={String(scale)}>
      <group ref={spin} scale={scale}>
        <primitive object={object} />
      </group>
    </Center>
  );
}

function Lights({ hot }: { hot?: boolean }) {
  return (
    <>
      <ambientLight intensity={hot ? 0.55 : 0.42} color="#f4f1ea" />
      <hemisphereLight args={["#f0e6c8", "#1a0408", 0.38]} />
      <directionalLight position={[2.1, 3.2, 3.6]} intensity={1.35} color="#fff4d8" />
      <directionalLight position={[-2.4, 1.1, 2]} intensity={0.32} color="#dfe8f5" />
      <pointLight position={[0, 1.1, 2.2]} intensity={hot ? 16 : 9} color={GOLD} distance={8} decay={2} />
      <pointLight position={[-1.4, 0.3, 1.6]} intensity={hot ? 11 : 7} color={MAROON} distance={7} decay={2} />
    </>
  );
}

function Glow({ hot }: { hot?: boolean }) {
  const gold = hot ? 0.82 : 0.62;
  const maroon = hot ? 0.9 : 0.78;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className="absolute top-[4%] left-[8%] h-4/5 w-4/5 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, rgb(207 181 59 / ${gold}) 0%, rgb(207 181 59 / ${gold * 0.32}) 46%, rgb(10 0 0 / 0) 74%)`,
        }}
      />
      <div
        className="absolute right-[2%] bottom-[2%] h-4/5 w-4/5 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, rgb(94 11 21 / ${maroon}) 0%, rgb(94 11 21 / ${maroon * 0.34}) 48%, rgb(10 0 0 / 0) 76%)`,
        }}
      />
    </div>
  );
}

function MysticCanvas({
  turns,
  whirl,
  reducedMotion,
}: {
  turns: number;
  whirl: boolean;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      camera={{ position: [0, 0.25, 4.3], fov: 32, near: 0.1, far: 40 }}
      resize={{ scroll: false }}
      style={{
        background: "transparent",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <Lights hot={whirl} />
      <Suspense fallback={null}>
        <MysticModel turns={turns} whirl={whirl} reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}

export function FooterMysticProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enabled = pathname === "/fortune";
  const reducedMotion = useReducedMotion() ?? false;
  const [busy, setBusy] = useState(false);
  const [flying, setFlying] = useState(false);
  const [turns, setTurns] = useState(0);
  const [whirl, setWhirl] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);

  const home = useCallback(() => {
    runId.current += 1;
    clearFlight(wrapRef.current);
    setWhirl(false);
    setFlying(false);
    setBusy(false);
  }, []);

  const launch = useCallback(() => {
    if (!enabled || busy) return;
    if (reducedMotion) {
      setTurns((n) => n + 1);
      return;
    }

    const id = ++runId.current;
    const still = () => id === runId.current;

    const run = async () => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const watchdog = window.setTimeout(() => {
        if (still()) home();
      }, 6000);

      try {
        setBusy(true);
        setTurns((n) => n + 2);
        await wait(450);
        if (!still()) return;

        setFlying(true);
        setWhirl(true);
        wrap.style.zIndex = "90";
        const lift = -(window.innerHeight + wrap.getBoundingClientRect().height);
        await animateY(wrap, 0, lift, 900, easeIn);
        if (!still()) return;

        await wait(180);
        if (!still()) return;

        await animateY(wrap, lift, 0, 800, easeOut);
        if (!still()) return;

        setWhirl(false);
        await wait(450);
      } catch (error) {
        console.error("[FooterMystic3D] launch failed:", error);
      } finally {
        window.clearTimeout(watchdog);
        if (still()) home();
      }
    };

    void run();
  }, [busy, enabled, home, reducedMotion]);

  useEffect(() => {
    return () => {
      runId.current += 1;
      clearFlight(wrapRef.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      flying,
      busy,
      reducedMotion,
      turns,
      whirl,
      wrapRef,
      launch,
    }),
    [busy, enabled, flying, launch, reducedMotion, turns, whirl],
  );

  return <FooterMysticContext.Provider value={value}>{children}</FooterMysticContext.Provider>;
}

export function MysticFooterFrame({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const { flying, enabled } = useMystic();
  return (
    <footer
      className={`relative isolate ${enabled && flying ? "overflow-visible" : "overflow-hidden"} ${className}`}
    >
      {children}
    </footer>
  );
}

export function FooterMysticSlot() {
  const { enabled, reducedMotion, turns, whirl, flying, busy, wrapRef, launch } = useMystic();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (enabled && URL) useGLTF.preload(URL);
  }, [enabled]);

  if (!enabled || !URL) return null;

  return (
    <div className="relative mx-auto mt-10 w-full max-w-54 overflow-visible">
      <button
        type="button"
        aria-label={reducedMotion ? "Spin the mystic" : "Launch the mystic"}
        disabled={busy}
        onClick={launch}
        className={`relative z-10 block ${SLOT_BOX} cursor-pointer border-0 bg-transparent p-0 disabled:cursor-wait`}
      >
        <div ref={wrapRef} className="relative h-full w-full">
          <Glow hot={whirl || flying} />
          {mounted ? (
            <div className="relative z-10 h-full w-full">
              <MysticCanvas turns={turns} whirl={whirl} reducedMotion={reducedMotion} />
            </div>
          ) : null}
        </div>
      </button>
      <p className="relative z-10 mt-2 text-center font-sans text-[0.58rem] tracking-[0.28em] text-[#FDFBF7]/45 uppercase">
        {reducedMotion ? "Tap to spin" : busy ? "Watch" : "Tap to launch"}
      </p>
    </div>
  );
}
