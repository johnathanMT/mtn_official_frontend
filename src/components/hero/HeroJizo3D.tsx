"use client";

/**
 * ============================================================================
 *  HERO JIZO 3D — interactive plate behind the name
 * ============================================================================
 *
 *  One wide diorama, centered and pulled back so the whole base sits in
 *  frame. Warm front light keeps the original stone readable; navy / cyan
 *  lights sit behind it so a blue aura bleeds out of the deep navy. The figure
 *  floats and eases toward the pointer. The GLB URL comes from mediaControl
 *  — never hardcoded here.
 * ============================================================================
 */

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  Float,
  Html,
  PerspectiveCamera,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import {
  ACESFilmicToneMapping,
  Box3,
  Group,
  MathUtils,
  Vector3,
} from "three";
import { MEDIA, cloudinaryModelUrl } from "@/config/mediaControl";

const JIZO_URL = cloudinaryModelUrl(MEDIA.hero.jizo.src, {
  resourceType: MEDIA.hero.jizo.resourceType,
});

const NAVY = "#001F3F";
const DEEP_BLUE = "#0B3B4C";
const DODGER = "#1E90FF";
const SKY = "#00BFFF";
const STONE_FILL = "#fff8f0";

const LERP = 0.055;
const PARALLAX_YAW = 0.22;
const PARALLAX_PITCH = 0.1;

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center style={{ pointerEvents: "none" }}>
      <div className="flex flex-col items-center gap-3 text-white">
        <span className="font-sans text-[0.62rem] tracking-[0.32em] uppercase text-white/45">
          Preparing
        </span>
        <p className="font-display m-0 text-2xl tracking-wide sm:text-3xl">
          Loading... {Math.round(progress)}%
        </p>
        <span aria-hidden="true" className="h-px w-28 bg-white/35" />
      </div>
    </Html>
  );
}

function JizoStatue({ url }: { url: string }) {
  const { scene } = useGLTF(url, true, true);
  const { viewport } = useThree();

  const native = useMemo(() => {
    const size = new Box3().setFromObject(scene).getSize(new Vector3());
    return {
      x: Math.max(size.x, 0.001),
      y: Math.max(size.y, 0.001),
    };
  }, [scene]);

  /* Fill the hero canvas: scale to the tighter of width/height so the whole
     diorama sits in frame — large, but never cropped on the sides or base. */
  const scale = Math.min(
    (viewport.width * 0.96) / native.x,
    (viewport.height * 0.92) / native.y,
  );

  return (
    <Center position={[0, -viewport.height * 0.03, 0]}>
      <primitive object={scene} scale={scale} />
    </Center>
  );
}

function StageLights() {
  return (
    <>
      <ambientLight intensity={0.62} color="#f4f1ea" />
      <hemisphereLight args={["#e8e4dc", "#0a1620", 0.5]} />
      {/* Front — reads the original stone, not a silhouette. */}
      <directionalLight
        position={[1.1, 2.2, 4.5]}
        intensity={1.7}
        color={STONE_FILL}
      />
      <directionalLight
        position={[-2.4, 1.0, 2.6]}
        intensity={0.4}
        color="#dfe8f5"
      />
      {/* Back — navy / cyan aura bleeding out of the void. */}
      <spotLight
        position={[0, 3.2, -10]}
        intensity={58}
        color={SKY}
        angle={0.7}
        penumbra={0.92}
        distance={28}
        decay={1.45}
      />
      <pointLight
        position={[0, 1.4, -7]}
        intensity={20}
        color={DODGER}
        distance={18}
        decay={2}
      />
      <pointLight
        position={[-4.5, 0.6, -6]}
        intensity={12}
        color={NAVY}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[4.5, 0.6, -6]}
        intensity={12}
        color={NAVY}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[0, -2.2, -5]}
        intensity={9}
        color={DODGER}
        distance={14}
        decay={2}
      />
    </>
  );
}

function ParallaxStage({
  children,
  reducedMotion,
}: {
  children: ReactNode;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;

    const onMove = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;
      pointer.current.x = (event.clientX / innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / innerHeight) * 2 - 1;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  useFrame(() => {
    const node = group.current;
    if (!node) return;

    const targetYaw = reducedMotion ? 0 : pointer.current.x * PARALLAX_YAW;
    const targetPitch = reducedMotion ? 0 : -pointer.current.y * PARALLAX_PITCH;

    node.rotation.y = MathUtils.lerp(node.rotation.y, targetYaw, LERP);
    node.rotation.x = MathUtils.lerp(node.rotation.x, targetPitch, LERP);
  });

  return <group ref={group}>{children}</group>;
}

function HeroScene({ reducedMotion }: { reducedMotion: boolean }) {
  const statue = <JizoStatue url={JIZO_URL} />;

  return (
    <>
      <color attach="background" args={[DEEP_BLUE]} />
      <StageLights />
      <ParallaxStage reducedMotion={reducedMotion}>
        {reducedMotion ? (
          statue
        ) : (
          <Float
            speed={0.8}
            rotationIntensity={0.08}
            floatIntensity={0.22}
            floatingRange={[-0.06, 0.08]}
          >
            {statue}
          </Float>
        )}
      </ParallaxStage>
    </>
  );
}

export default function HeroJizo3D() {
  const reducedMotion = useReducedMotion() ?? false;

  if (!JIZO_URL) return null;

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      resize={{ scroll: false }}
      style={{ background: DEEP_BLUE, width: "100%", height: "100%" }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 0.35, 12]}
        fov={42}
        near={0.1}
        far={120}
      />
      <Suspense fallback={<Loader />}>
        <HeroScene reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}

if (JIZO_URL) {
  useGLTF.preload(JIZO_URL);
}
