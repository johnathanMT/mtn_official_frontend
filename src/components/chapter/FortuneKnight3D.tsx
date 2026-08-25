"use client";

/**
 * Knight under the Destiny artwork. The small figure stays in its slot.
 * Tap opens a fullscreen overlay so he can charge at the lens without
 * running off the page, then the overlay closes.
 */

import * as React from "react";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import { useReducedMotion, useScroll, type MotionValue } from "motion/react";
import { Box3, Group, Vector3, type Object3D } from "three";
import { MEDIA, cloudinaryModelUrl } from "@/config/mediaControl";

const URL = cloudinaryModelUrl(MEDIA.tarot.knight.src, {
  resourceType: MEDIA.tarot.knight.resourceType,
});

const IN_SECONDS = 0.55;
const HOLD_SECONDS = 0.28;
const OUT_SECONDS = 0.95;
const START_Z = -1.6;
const PEAK_Z = 0.85;
const START_SCALE = 0.55;
const PEAK_SCALE = 1;
const FACE_CAMERA = 0;
const CAM_FOV = 40;
const HALF_TAN = Math.tan((CAM_FOV / 2) * (Math.PI / 180));
const SHAKE_GAIN = 0.014;
const SHAKE_MAX = 0.1;

function subscribeNever() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

type Phase = "idle" | "in" | "hold" | "out";

function easeInExpo(t: number) {
  return t <= 0 ? 0 : Math.pow(2, 10 * t - 10);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useNativeBox(scene: Object3D) {
  return useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const safe = (v: number) => (Number.isFinite(v) ? Math.max(v, 0.001) : 1);
    return { width: safe(size.x), height: safe(size.y), depth: safe(size.z) };
  }, [scene]);
}

function containScale(
  native: { width: number; height: number; depth: number },
  aspect: number,
  camZ: number,
  fill: number,
) {
  let scale = 1;
  for (let i = 0; i < 6; i += 1) {
    const distance = Math.max(camZ - (native.depth * scale) / 2, camZ * 0.35);
    const frameH = 2 * distance * HALF_TAN;
    const frameW = frameH * aspect;
    scale = Math.min(
      (Math.max(frameW, 0.001) * fill) / native.width,
      (Math.max(frameH, 0.001) * fill) / native.height,
    );
  }
  return scale;
}

function FittedKnight({
  fill,
  lunge,
  onDone,
  camZ,
  scrollY,
  reducedMotion,
}: {
  fill: number;
  lunge: boolean;
  onDone?: () => void;
  camZ: number;
  scrollY?: MotionValue<number>;
  reducedMotion?: boolean;
}) {
  const { scene } = useGLTF(URL, true, true);
  const object = useMemo(() => scene.clone(true), [scene]);
  const native = useNativeBox(object);
  const root = useRef<Group>(null);
  const phase = useRef<Phase>(lunge ? "in" : "idle");
  const elapsed = useRef(0);
  const done = useRef(false);
  const lastScroll = useRef(0);
  const primedScroll = useRef(false);
  const shake = useRef(0);

  const size = useThree((state) => state.size);
  const aspect =
    size.width > 0 && size.height > 0 ? size.width / size.height : 16 / 9;
  const fit = useMemo(
    () => containScale(native, aspect, camZ, fill),
    [aspect, camZ, fill, native],
  );

  useFrame((state, delta) => {
    const node = root.current;
    if (!node) return;

    if (!lunge || phase.current === "idle") {
      node.position.z = 0;
      node.scale.setScalar(1);

      if (reducedMotion || !scrollY) {
        node.position.x = 0;
        node.position.y = 0;
        node.rotation.z = 0;
        return;
      }

      const y = scrollY.get();
      if (!primedScroll.current) {
        lastScroll.current = y;
        primedScroll.current = true;
      }
      const vy = y - lastScroll.current;
      lastScroll.current = y;
      const down = Math.max(0, vy);
      const target = Math.min(down * SHAKE_GAIN, SHAKE_MAX);
      const follow = 1 - Math.exp(-delta * 16);
      shake.current += (target - shake.current) * follow;

      if (shake.current < 0.0005) {
        node.position.x = 0;
        node.position.y = 0;
        node.rotation.z = 0;
        return;
      }

      const t = state.clock.elapsedTime;
      node.position.x = Math.sin(t * 52) * shake.current;
      node.position.y = Math.cos(t * 41) * shake.current * 0.55;
      node.rotation.z = Math.sin(t * 33) * shake.current * 0.35;
      return;
    }

    node.position.x = 0;
    node.position.y = 0;
    node.rotation.z = 0;

    elapsed.current += delta;

    if (phase.current === "in") {
      const t = Math.min(1, elapsed.current / IN_SECONDS);
      const k = easeInExpo(t);
      node.position.z = START_Z + (PEAK_Z - START_Z) * k;
      node.scale.setScalar(START_SCALE + (PEAK_SCALE - START_SCALE) * k);
      if (t >= 1) {
        phase.current = "hold";
        elapsed.current = 0;
      }
      return;
    }

    if (phase.current === "hold") {
      node.position.z = PEAK_Z;
      node.scale.setScalar(PEAK_SCALE);
      if (elapsed.current >= HOLD_SECONDS) {
        phase.current = "out";
        elapsed.current = 0;
      }
      return;
    }

    const t = Math.min(1, elapsed.current / OUT_SECONDS);
    const k = easeOutCubic(t);
    node.position.z = PEAK_Z + (START_Z - PEAK_Z) * k;
    node.scale.setScalar(PEAK_SCALE + (START_SCALE - PEAK_SCALE) * k);
    if (t >= 1 && !done.current) {
      done.current = true;
      onDone?.();
    }
  });

  return (
    <Center cacheKey={`${fit}:${fill}`} disableZ>
      <group
        ref={root}
        position={[0, 0, lunge ? START_Z : 0]}
        scale={lunge ? START_SCALE : 1}
      >
        <group scale={fit} rotation={[0, FACE_CAMERA, 0]}>
          <primitive object={object} />
        </group>
      </group>
    </Center>
  );
}

function Lights({ close }: { close?: boolean }) {
  return (
    <>
      <ambientLight intensity={close ? 0.7 : 0.55} color="#f4f1ea" />
      <hemisphereLight args={["#e8e4dc", "#0a0a0a", 0.4]} />
      <directionalLight position={[2.4, 3.4, 4]} intensity={1.55} color="#fff8f0" />
      <directionalLight position={[-2.2, 1.4, 2.2]} intensity={0.4} color="#dfe8f5" />
      <pointLight position={[-1.8, 0.5, 2]} intensity={8} color="#5E0B15" distance={8} decay={2} />
      <pointLight position={[1.8, 0.8, 2.2]} intensity={7} color="#0B3B4C" distance={8} decay={2} />
      {close ? (
        <pointLight position={[0, 0.2, 3.6]} intensity={18} color="#5E0B15" distance={12} decay={2} />
      ) : (
        <pointLight position={[0, 0.4, 3.2]} intensity={10} color="#5E0B15" distance={8} decay={2} />
      )}
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
    console.error("[FortuneKnight3D] figure failed:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function KnightCanvas({
  fill,
  lunge,
  onDone,
  cameraZ,
  scrollY,
  reducedMotion,
}: {
  fill: number;
  lunge: boolean;
  onDone?: () => void;
  cameraZ: number;
  scrollY?: MotionValue<number>;
  reducedMotion?: boolean;
}) {
  return (
    <StageErrorBoundary>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 1.15, cameraZ], fov: CAM_FOV, near: 0.1, far: 80 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0);
          camera.lookAt(0, 0.35, 0);
          camera.updateProjectionMatrix();
        }}
        resize={{ scroll: false }}
        style={{
          background: "transparent",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <Lights close={lunge} />
        <Suspense fallback={null}>
          <FittedKnight
            fill={fill}
            lunge={lunge}
            onDone={onDone}
            camZ={cameraZ}
            scrollY={scrollY}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </StageErrorBoundary>
  );
}

function ChargeOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] h-svh w-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 58%, rgb(94 11 21 / 0.45) 0%, rgb(11 59 76 / 0.28) 42%, rgb(0 0 0 / 0.82) 78%)",
        }}
      />
      <div className="absolute inset-0">
        <KnightCanvas fill={0.88} lunge cameraZ={6.4} onDone={onDone} />
      </div>
    </div>
  );
}

export default function FortuneKnight3D() {
  const reducedMotion = useReducedMotion() ?? false;
  const { scrollY } = useScroll();
  const mounted = useIsClient();
  const [charging, setCharging] = useState(false);

  if (!URL) return null;

  if (!mounted) {
    return <div className="h-80 w-full max-w-xl sm:h-88" aria-hidden="true" />;
  }

  return (
    <div className="relative w-full max-w-xl overflow-visible">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className="absolute top-[6%] left-[4%] h-4/5 w-4/5 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(11 59 76 / 0.75) 0%, rgb(11 59 76 / 0.22) 48%, rgb(10 10 10 / 0) 74%)",
          }}
        />
        <div
          className="absolute right-[2%] bottom-[4%] h-4/5 w-4/5 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(94 11 21 / 0.78) 0%, rgb(94 11 21 / 0.26) 46%, rgb(10 10 10 / 0) 74%)",
          }}
        />
      </div>

      <button
        type="button"
        aria-label="Charge the knight toward you"
        disabled={charging || reducedMotion}
        onClick={() => {
          if (charging || reducedMotion) return;
          setCharging(true);
        }}
        className="relative z-10 block h-80 w-full cursor-pointer border-0 bg-transparent p-0 sm:h-88"
      >
        <KnightCanvas
          fill={0.82}
          lunge={false}
          cameraZ={6.6}
          scrollY={scrollY}
          reducedMotion={reducedMotion}
        />
      </button>
      <p className="mt-2 text-right font-sans text-[0.58rem] tracking-[0.28em] text-gray-500 uppercase">
        {reducedMotion ? "Still" : "Tap to charge"}
      </p>

      {charging
        ? createPortal(
            <ChargeOverlay onDone={() => setCharging(false)} />,
            document.body,
          )
        : null}
    </div>
  );
}

if (typeof window !== "undefined" && URL) useGLTF.preload(URL);
