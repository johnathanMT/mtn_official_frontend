"use client";

/**
 * Zawgyi under the profile portrait. A small canvas — not a second hero.
 * Page scroll turns him; tap (or Enter/Space) adds one full spin on top.
 */

import * as React from "react";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { useReducedMotion, useScroll, type MotionValue } from "motion/react";
import { Box3, Group, Vector3, type Object3D } from "three";
import { MEDIA, cloudinaryModelUrl } from "@/config/mediaControl";

const URL = cloudinaryModelUrl(MEDIA.landing.zawgyi.src, {
  resourceType: MEDIA.landing.zawgyi.resourceType,
});

const MAROON = "#5E0B15";
const NAVY = "#0B3B4C";
const SPIN_SECONDS = 1.35;
const TWO_PI = Math.PI * 2;
/** Extra turns from entering the viewport to leaving it. Zero at centre. */
const TURNS_ACROSS_PASS = 0.5;
/** Hold a front-facing pose while he sits in the middle of the screen. */
const FACE_FRONT_BAND = 0.2;

function subscribeNever() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

function useNativeBox(scene: Object3D) {
  return useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const safe = (v: number) => (Number.isFinite(v) ? Math.max(v, 0.001) : 1);
    return { width: safe(size.x), height: safe(size.y), depth: safe(size.z) };
  }, [scene]);
}

function scrollFacing(progress: number) {
  const offset = progress - 0.5;
  if (Math.abs(offset) <= FACE_FRONT_BAND) return 0;
  const span = 0.5 - FACE_FRONT_BAND;
  const signed = Math.sign(offset) * (Math.abs(offset) - FACE_FRONT_BAND) / span;
  return signed * TWO_PI * TURNS_ACROSS_PASS;
}

function ZawgyiModel({
  turns,
  reducedMotion,
  scrollProgress,
}: {
  turns: number;
  reducedMotion: boolean;
  scrollProgress: MotionValue<number>;
}) {
  const { scene } = useGLTF(URL, true, true);
  const object = useMemo(() => scene.clone(true), [scene]);
  const native = useNativeBox(object);
  const spin = useRef<Group>(null);
  const yaw = useRef(0);
  const from = useRef(0);
  const to = useRef(0);
  const progress = useRef(1);
  const scrollYaw = useRef(0);

  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);
  const scale = useMemo(() => {
    if (size.width <= 0 || size.height <= 0) return 1;
    return Math.min(
      (viewport.width * 0.72) / native.width,
      (viewport.height * 0.9) / native.height,
    );
  }, [native.height, native.width, size.height, size.width, viewport.height, viewport.width]);

  useEffect(() => {
    const next = turns * TWO_PI;
    if (reducedMotion) {
      yaw.current = next;
      to.current = next;
      progress.current = 1;
      if (spin.current) spin.current.rotation.y = next + scrollYaw.current;
      return;
    }
    from.current = yaw.current;
    to.current = next;
    progress.current = 0;
  }, [reducedMotion, turns]);

  useFrame((_, delta) => {
    const node = spin.current;
    if (!node) return;

    if (!reducedMotion) {
      const target = scrollFacing(scrollProgress.get());
      const follow = 1 - Math.exp(-delta * 10);
      scrollYaw.current += (target - scrollYaw.current) * follow;
    } else {
      scrollYaw.current = 0;
    }

    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta / SPIN_SECONDS);
      const ease = 1 - Math.pow(1 - progress.current, 3);
      yaw.current = from.current + (to.current - from.current) * ease;
    }
    node.rotation.y = yaw.current + scrollYaw.current;
  });

  return (
    <Center cacheKey={scale}>
      <group ref={spin} scale={scale}>
        <primitive object={object} />
      </group>
    </Center>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.7} color="#f4f1ea" />
      <hemisphereLight args={["#e8e4dc", "#0B3B4C", 0.45]} />
      <directionalLight position={[2.2, 3.2, 4]} intensity={1.45} color="#fff8f0" />
      <directionalLight position={[-2.4, 1.2, 2]} intensity={0.35} color="#dfe8f5" />
      <pointLight position={[-1.6, 0.4, 1.2]} intensity={8} color={MAROON} distance={7} decay={2} />
      <pointLight position={[1.8, 0.8, 1.4]} intensity={7} color={NAVY} distance={7} decay={2} />
    </>
  );
}

class StageErrorBoundary extends React.Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ProfileZawgyi3D] figure failed:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ProfileZawgyi3D() {
  const reducedMotion = useReducedMotion() ?? false;
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });
  const [turns, setTurns] = useState(0);
  const mounted = useIsClient();

  if (!URL) return null;

  if (!mounted) {
    return (
      <div
        ref={stageRef}
        className="mx-auto h-64 w-full max-w-[22rem] sm:h-72"
        aria-hidden="true"
      />
    );
  }

  return (
    <div ref={stageRef} className="relative mx-auto w-full max-w-[22rem]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className="absolute top-[8%] left-[6%] h-3/4 w-3/4 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(11 59 76 / 0.7) 0%, rgb(11 59 76 / 0.22) 48%, rgb(42 42 42 / 0) 72%)",
          }}
        />
        <div
          className="absolute right-[4%] bottom-[6%] h-3/4 w-3/4 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(94 11 21 / 0.72) 0%, rgb(94 11 21 / 0.24) 46%, rgb(42 42 42 / 0) 72%)",
          }}
        />
      </div>

      <button
        type="button"
        aria-label="Zawgyi figure. He faces you when you reach him. Scroll to turn him, or tap to spin once."
        onClick={() => setTurns((n) => n + 1)}
        className="relative z-10 block h-64 w-full cursor-pointer border-0 bg-transparent p-0 sm:h-72"
      >
        <StageErrorBoundary>
          <Canvas
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
            camera={{ position: [0, 0.2, 4.2], fov: 32, near: 0.1, far: 40 }}
            resize={{ scroll: false }}
            style={{
              background: "transparent",
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <Lights />
            <Suspense fallback={null}>
              <ZawgyiModel
                turns={turns}
                reducedMotion={reducedMotion}
                scrollProgress={scrollYProgress}
              />
            </Suspense>
          </Canvas>
        </StageErrorBoundary>
      </button>
      <p className="relative z-10 mt-2 text-center font-sans text-[0.58rem] tracking-[0.28em] text-stone-500 uppercase">
        {reducedMotion ? "Tap to spin" : "Scroll turns him · Tap to spin"}
      </p>
    </div>
  );
}

if (typeof window !== "undefined" && URL) useGLTF.preload(URL);
