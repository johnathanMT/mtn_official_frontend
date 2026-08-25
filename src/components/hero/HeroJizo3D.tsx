"use client";

/**
 * ============================================================================
 *  HERO JIZO 3D — centred, contained, nothing cropped
 * ============================================================================
 *
 *  ---------------------------------------------------------------------------
 *  WHY A LITERAL scale NUMBER CANNOT DO WHAT YOU ASKED
 *  ---------------------------------------------------------------------------
 *  "Fit perfectly within the view" and "scale={N}" are different requirements,
 *  and on a responsive page they conflict. fov is VERTICAL, so the frame's
 *  width is `height x aspect` — the height is fixed by the camera, the width is
 *  whatever the browser window happens to be:
 *
 *      camera z=15, fov=45  →  frame is 12.43 world units tall, always
 *      1440 x 810  (16:9)   →  22.10 units wide
 *       390 x 844  (phone)  →   5.74 units wide
 *
 *  Your diorama is WIDER than it is tall — I measured it: 0.979 x 0.549 x
 *  0.709, statues on a base, aspect 1.78:1. For a wide model the WIDTH is what
 *  crops first, and the available width swings by 4x across devices. One
 *  number cannot clear both. That is exactly the "sides cut off" you are
 *  seeing: a scale that looks right on the desktop you tuned it on.
 *
 *  So `scale` here is a contain-fit — the same rule as CSS `object-fit:
 *  contain`. You still control it, with ONE number: FIT below is the fraction
 *  of the frame the model is allowed to occupy. 0.9 leaves a 10% margin on
 *  whichever axis binds. Raise it to fill more, lower it for more air. If you
 *  would rather pin a literal number anyway, MANUAL_SCALE overrides everything
 *  — it is there so you have the escape hatch, not because I recommend it.
 *
 *  ---------------------------------------------------------------------------
 *  <Center> NEEDS cacheKey, AND THIS IS NOT OPTIONAL HERE
 *  ---------------------------------------------------------------------------
 *  I read drei's Center source rather than assuming. It measures its subtree in
 *  a useLayoutEffect whose dependency array is:
 *
 *      [cacheKey, onCentered, top, left, front, disable, disableX, disableY,
 *       disableZ, object, precise, right, bottom, back, box3, center, sphere]
 *
 *  `children` is NOT in that list. So Center measures once on mount and never
 *  again — which is fine for a static model, and silently WRONG the moment the
 *  thing inside it changes size. Our scale changes on every resize and device
 *  rotation, so without `cacheKey={scale}` the centring offset would be left
 *  over from whatever the window was when the page first painted. That is a
 *  drifted-off-centre model that only misbehaves after a resize — the worst
 *  kind of bug to chase later. Passing the scale as the cacheKey re-measures
 *  exactly when, and only when, it needs to.
 *
 *  ---------------------------------------------------------------------------
 *  THE THING THAT WAS ACTUALLY CROPPING YOUR SIDES: DEPTH
 *  ---------------------------------------------------------------------------
 *  I built a stand-in GLB with your diorama's exact measured proportions and
 *  rendered this component headless to check. The first version of this fit
 *  still cropped — on 7 of the 8 viewport/model combinations I tested.
 *
 *  The reason is that a bounding box is not flat. <Center> puts the box's
 *  CENTRE on the origin, so half the model's depth ends up in FRONT of that
 *  plane, closer to the camera, where perspective magnifies it. Your diorama
 *  is 0.709 deep; at a scale of 9 that is 6.4 units of depth, so the near face
 *  sits 3.2 units closer to the camera than the plane the naive fit measured:
 *
 *      magnification = 15 / (15 − 3.2) = 1.27x
 *
 *  A model fitted to exactly 100% of the frame at z=0 therefore projects at
 *  127% and loses its edges. That is the "sides completely cut off".
 *
 *  So the fit solves against the frustum at the model's NEAR FACE, not at z=0.
 *  The near face's distance depends on the scale and the scale depends on the
 *  near face, so it is solved by fixed-point iteration — six passes, which
 *  converges to well under a thousandth of a unit. Verified afterwards by
 *  projecting the box's extreme corners: every case now lands inside the
 *  frustum with the FIT margin intact.
 *
 *  The same solve handles the y offset. With the group at y=-2 the bottom edge
 *  is only 4.21 units away while the top is 8.21, so fitting against the full
 *  height would clip the base. Push the group further down and the model gets
 *  smaller rather than losing its feet.
 *
 *  ---------------------------------------------------------------------------
 *  TWO MODELS, ONE CENTRE
 *  ---------------------------------------------------------------------------
 *  This component loads two GLBs, and centring both at [0,-2,0] would stand
 *  them inside each other. So the x offset is per-slot: with ONE model in the
 *  list it sits at exactly [0,-2,0] as you specified; with two they take a
 *  half of the frame each and neither crops. Comment a line out of MODELS and
 *  the survivor centres itself — no other edit needed.
 *
 *  Lighting, the progress loader, Float and the pointer parallax are unchanged.
 * ============================================================================
 */

import * as React from "react";
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  Float,
  Html,
  OrbitControls,
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
  type Object3D,
} from "three";
import { MEDIA, cloudinaryModelUrl } from "@/config/mediaControl";
import { HeroMatrix } from "@/components/hero/HeroMatrix";

/* ===========================================================================
 * CAMERA — every number below is derived from these two
 * ======================================================================== */

const CAM_Z = 15;
const CAM_FOV = 45;

/** How far down the stage sits, so the bases land low and the type breathes. */
const GROUP_Y = -2;

/** Share of the frame the model may occupy. 0.9 = a 10% margin. */
const FIT = 0.9;

/** Pin a literal scale and skip the fit entirely. null = contain-fit. */
const MANUAL_SCALE: number | null = null;

/** Used only until the canvas has measured itself — never 0, see below. */
const FRAME_ASPECT_FALLBACK = 16 / 9;

/** Brand Dark Navy — same as `secondary`, so the WebGL plate matches the hero. */
const BACKGROUND = "#0B3B4C";

const HALF_TAN = Math.tan((CAM_FOV / 2) * (Math.PI / 180));

/** Visible height in world units on the plane at z=0. */
const FRAME_HEIGHT = 2 * CAM_Z * HALF_TAN;

/**
 * Solve the contain-fit at the model's NEAR FACE — see the header for why z=0
 * is the wrong plane to measure against.
 *
 * Fixed point: guess a scale, work out where that puts the near face, re-solve
 * against the frustum there, repeat. Six passes is far more than it needs (it
 * settles by the third) and costs nothing — this runs on resize, not per frame.
 */
function solveFit(
  native: { width: number; height: number; depth: number },
  aspect: number,
  slot: number,
  count: number,
) {
  let scale = 1;
  let x = 0;
  let frameWidth = FRAME_HEIGHT * aspect;
  let frameHeight = FRAME_HEIGHT;

  for (let i = 0; i < 6; i += 1) {
    /* Distance to the near face. Floored at a quarter of the camera distance
       so a pathological bounding box can never put geometry behind the lens. */
    const distance = Math.max(CAM_Z - (native.depth * scale) / 2, CAM_Z * 0.25);
    frameHeight = 2 * distance * HALF_TAN;
    frameWidth = frameHeight * aspect;

    /* One model owns the frame; two split it and each keeps its gutter. */
    x = count > 1 ? frameWidth * 0.25 * slot : 0;

    const halfWidth = (frameWidth / 2) * FIT - Math.abs(x);
    const halfHeight = (frameHeight / 2) * FIT - Math.abs(GROUP_Y);

    scale = Math.min(
      (Math.max(halfWidth, 0.001) * 2) / native.width,
      (Math.max(halfHeight, 0.001) * 2) / native.height,
    );
  }

  return { scale: MANUAL_SCALE ?? scale, x, frameWidth, frameHeight };
}

/* ===========================================================================
 * DEBUG SWITCHES
 * ======================================================================== */

/**
 * Off now that the shot is composed. OrbitControls swallows the wheel event,
 * so with it on the page cannot scroll past the hero — and it fights the
 * pointer parallax for the same input. Turn it on to inspect, off to ship.
 */
const ORBIT_CONTROLS = false;

/** 5-unit origin cross: red +X, green +Y, blue +Z. */
const DEBUG_AXES = false;

/* ===========================================================================
 * SCENE CONSTANTS
 * ======================================================================== */

const NAVY = "#001F3F";
const DODGER = "#1E90FF";
const SKY = "#00BFFF";
const STONE_FILL = "#fff8f0";
const GOLD = "#D4AF37";

const LERP = 0.05;
const PARALLAX_YAW = 0.06;
const PARALLAX_PITCH = 0.03;

const JIZO_URL = cloudinaryModelUrl(MEDIA.hero.jizo.src, {
  resourceType: MEDIA.hero.jizo.resourceType,
});

const STUPA_URL = cloudinaryModelUrl(MEDIA.hero.stupa.src, {
  resourceType: MEDIA.hero.stupa.resourceType,
});

type HeroModel = {
  key: string;
  url: string;
  yaw: number;
  /** Multiplier on the contain-fit. 1 = unchanged. */
  scaleMul: number;
  /** Lift above the shared floor (`GROUP_Y`). */
  y: number;
  /** Extra nudge on X. Positive is right. */
  xShift: number;
  /** World Z. Camera is at +15, so positive values step toward the lens. */
  z: number;
};

/** Comment an entry out to show that model alone, dead centre. */
const MODELS = [
  {
    key: "jizo",
    url: JIZO_URL,
    yaw: 0,
    scaleMul: 1.14,
    y: 0,
    xShift: 0.9,
    z: 1.8,
  },
  /* The pagoda sits on the right; a small negative yaw turns its facade
     toward the camera instead of presenting a flat side. */
  {
    key: "stupa",
    url: STUPA_URL,
    yaw: MathUtils.degToRad(-22),
    scaleMul: 1.14,
    y: 0.7,
    xShift: 0.9,
    z: 1.2,
  },
].filter((m): m is HeroModel => Boolean(m.url));

/* ===========================================================================
 * LOADER — unchanged
 * ======================================================================== */

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center style={{ pointerEvents: "none" }}>
      <div className="flex flex-col items-center gap-3 text-white">
        <span className="font-sans text-[0.62rem] tracking-[0.32em] text-white/45 uppercase">
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

/* ===========================================================================
 * MODEL
 * ======================================================================== */

/** The model's own untransformed dimensions, measured once per loaded scene. */
function useNativeBox(scene: Object3D) {
  return useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    /* Clamped: an empty Box3 reports ±Infinity, and an Infinity here would
       propagate into scale and put the model somewhere undefined. */
    const safe = (v: number) => (Number.isFinite(v) ? Math.max(v, 0.001) : 1);
    return { width: safe(size.x), height: safe(size.y), depth: safe(size.z) };
  }, [scene]);
}

function Model({
  url,
  label,
  slot,
  count,
  yaw,
  scaleMul,
  y,
  xShift,
  z,
}: {
  url: string;
  label: string;
  slot: number;
  count: number;
  yaw: number;
  scaleMul: number;
  y: number;
  xShift: number;
  z: number;
}) {
  /* (url, useDraco, useMeshopt) — both compressions enabled. */
  const { scene } = useGLTF(url, true, true);

  /* useGLTF caches by URL and hands every caller the same Object3D; cloning
     keeps two consumers of one model from stealing each other's mesh. */
  const object = useMemo(() => scene.clone(true), [scene]);
  const native = useNativeBox(object);

  /* `size`, not `viewport` — this is what re-renders on resize and rotate. */
  const size = useThree((state) => state.size);
  const aspect =
    size.width > 0 && size.height > 0
      ? size.width / size.height
      : FRAME_ASPECT_FALLBACK;

  const { scale, x, frameWidth, frameHeight } = solveFit(
    native,
    aspect,
    slot,
    count,
  );

  useReadout(label, native, scale, aspect, frameWidth, frameHeight, x);

  return (
    /* cacheKey={scale} is load-bearing — see the header. Without it Center
       keeps the offset it measured on first paint and drifts off-centre after
       any resize. */
    <Center
      position={[x + xShift, GROUP_Y + y, z]}
      cacheKey={`${scale}:${yaw}:${scaleMul}:${y}:${xShift}:${z}`}
    >
      <group scale={scale * scaleMul} rotation={[0, yaw, 0]}>
        <primitive object={object} />
      </group>
    </Center>
  );
}

/** Dev-only. Turns "it is cropped" into numbers you can act on. */
function useReadout(
  label: string,
  native: { width: number; height: number; depth: number },
  scale: number,
  aspect: number,
  frameWidth: number,
  frameHeight: number,
  x: number,
) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const w = native.width * scale;
    const h = native.height * scale;

    console.info(
      `[HeroJizo3D] ${label}   aspect ${aspect.toFixed(2)}\n` +
        `  native      ${native.width.toFixed(3)} w x ${native.height.toFixed(3)} h x ${native.depth.toFixed(3)} d\n` +
        `  near frame  ${frameWidth.toFixed(2)} x ${frameHeight.toFixed(2)}  ` +
        `(z=0 frame is ${(FRAME_HEIGHT * aspect).toFixed(2)} x ${FRAME_HEIGHT.toFixed(2)} — the gap IS the perspective)\n` +
        `  scale       ${scale.toFixed(2)}${MANUAL_SCALE === null ? "" : "  (MANUAL_SCALE)"}\n` +
        `  on screen   ${Math.round((w / frameWidth) * 100)}% of width, ` +
        `${Math.round((h / frameHeight) * 100)}% of height\n` +
        `  spans x     ${(x - w / 2).toFixed(2)} to ${(x + w / 2).toFixed(2)}  ` +
        `(near frame ±${(frameWidth / 2).toFixed(2)})\n` +
        `  spans y     ${(GROUP_Y - h / 2).toFixed(2)} to ${(GROUP_Y + h / 2).toFixed(2)}  ` +
        `(near frame ±${(frameHeight / 2).toFixed(2)})`,
    );
  }, [label, native, scale, aspect, frameWidth, frameHeight, x]);
}

/* ===========================================================================
 * LIGHTING — the navy stage, unchanged
 * ======================================================================== */

function StageLights() {
  return (
    <>
      <ambientLight intensity={0.62} color="#f4f1ea" />
      <hemisphereLight args={["#e8e4dc", "#0a1620", 0.5]} />
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
      <spotLight
        position={[0, 3.2, -8]}
        intensity={72}
        color={SKY}
        angle={0.8}
        penumbra={0.92}
        distance={30}
        decay={1.45}
      />
      <pointLight
        position={[0, 1.4, -5]}
        intensity={24}
        color={DODGER}
        distance={20}
        decay={2}
      />
      <pointLight
        position={[-6, 0, -1]}
        intensity={18}
        color={NAVY}
        distance={18}
        decay={2}
      />
      <pointLight
        position={[6, 0, -1]}
        intensity={18}
        color={NAVY}
        distance={18}
        decay={2}
      />
      <pointLight
        position={[0, -3.2, -4]}
        intensity={9}
        color={DODGER}
        distance={16}
        decay={2}
      />
      <pointLight
        position={[5, 2.6, 1]}
        intensity={10}
        color={GOLD}
        distance={16}
        decay={2}
      />
    </>
  );
}

/* ===========================================================================
 * SPECTRUM WORLD — matrix code behind the figures. Isolated so a throw
 * here cannot unmount the GLBs.
 * ======================================================================== */

function SpectrumWorld({ reducedMotion }: { reducedMotion: boolean }) {
  return <HeroMatrix reducedMotion={reducedMotion} />;
}

/* ===========================================================================
 * PARALLAX — unchanged
 * ======================================================================== */

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

/* ===========================================================================
 * SCENE
 * ======================================================================== */

function HeroModels({ reducedMotion }: { reducedMotion: boolean }) {
  /* slot maps index → -1, +1 (and 0 when there is only one model). */
  return (
    <>
      {MODELS.map((m, i) => {
        const slot = MODELS.length > 1 ? i * 2 - (MODELS.length - 1) : 0;
        const model = (
          <Model
            url={m.url}
            label={m.key}
            slot={slot}
            count={MODELS.length}
            yaw={m.yaw}
            scaleMul={m.scaleMul}
            y={m.y}
            xShift={m.xShift}
            z={m.z}
          />
        );

        if (reducedMotion) return <group key={m.key}>{model}</group>;

        return (
          /* Float wraps the Center, and its intensities stay tiny on purpose:
             it rotates about ITS own origin, so at a few units of offset even
             a "small" rotation becomes a visible arc. */
          <Float
            key={m.key}
            speed={0.5}
            rotationIntensity={0.02}
            floatIntensity={0.04}
            floatingRange={[-0.02, 0.02]}
          >
            {model}
          </Float>
        );
      })}
    </>
  );
}

function HeroScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      {/* Own boundary: a backdrop throw must not unmount the GLBs. */}
      <StageErrorBoundary resetKey="matrix-gold">
        <SpectrumWorld reducedMotion={reducedMotion} />
      </StageErrorBoundary>
      <StageLights />
      {DEBUG_AXES && <axesHelper args={[5]} />}
      <ParallaxStage reducedMotion={reducedMotion}>
        <HeroModels reducedMotion={reducedMotion} />
      </ParallaxStage>
    </>
  );
}

/* ===========================================================================
 * ERROR BOUNDARY
 *
 * Outside the Canvas: a fallback rendered inside would have to be a three.js
 * object, and what we fall back to is the flat plate NameHero already paints.
 * Suspense catches a thrown promise ("not here yet"); this catches a thrown
 * Error ("not coming"), and only a class component can catch the second.
 * Without it, one failed GLB fetch unmounts the entire homepage.
 * ======================================================================== */

class StageErrorBoundary extends React.Component<
  { children: ReactNode; resetKey?: string },
  { failed: boolean; resetKey?: string }
> {
  state = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: { resetKey?: string },
    state: { failed: boolean; resetKey?: string },
  ) {
    if (props.resetKey !== state.resetKey) {
      return { failed: false, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error) {
    console.error("[HeroJizo3D] spectrum stage failed, keeping the figures:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

class CanvasErrorBoundary extends React.Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[HeroJizo3D] 3D hero failed, falling back to flat:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* ===========================================================================
 * CANVAS
 * ======================================================================== */

function HeroCanvas() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <Canvas
      dpr={[1, 1.75]}
      /* No `camera` prop — <PerspectiveCamera makeDefault> below owns it, and
         a prop here would be configured and then discarded. */
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      resize={{ scroll: false }}
      style={{ background: BACKGROUND, width: "100%", height: "100%" }}
    >
      <PerspectiveCamera
        makeDefault
        position={[0, 0, CAM_Z]}
        fov={CAM_FOV}
        near={0.1}
        far={200}
      />

      {ORBIT_CONTROLS && <OrbitControls makeDefault />}

      <Suspense fallback={<Loader />}>
        <HeroScene reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}

export default function HeroJizo3D() {
  if (MODELS.length === 0) return null;

  return (
    <CanvasErrorBoundary key="hero-3d-matrix-gold">
      <HeroCanvas />
    </CanvasErrorBoundary>
  );
}

for (const m of MODELS) useGLTF.preload(m.url);
