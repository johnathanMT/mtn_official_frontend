"use client";

/**
 * ============================================================================
 *  ART — LONELINESS SCENE  ·  solitude, expanse, melancholy hope
 * ============================================================================
 *
 *  A vast desert that shears off into a calm, apparently endless sea. Dry
 *  trees stitch the waterline. Inland, one mountain. At the largest tree a
 *  figure so small it is almost a mark on the sand — loneliness as scale.
 *
 *  Day: moody blue, a large sun, drifting clouds, kites leaving the tree
 *  for the horizon, butterflies. Night: near-black sky, dense stars, a cool
 *  moon, sage fireflies. Kites vanish after dusk.
 *
 *  One unit is one metre. useGrounded() scales every GLB to a target height.
 *  Props stand on duneHeight(), not y=0. Each remote model is fenced with
 *  Suspense and an error boundary. Day/night starts from local time; the
 *  overlay toggle overrides it.
 * ============================================================================
 */

import * as React from "react";
import { Suspense, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Float,
  Html,
  OrbitControls,
  PerspectiveCamera,
  Sky,
  Sparkles,
  Stars,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Box3,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MathUtils,
  Object3D,
  UniformsLib,
  UniformsUtils,
  Vector3,
  type AmbientLight,
  type DirectionalLight,
  type FogExp2,
  type PerspectiveCamera as ThreePerspectiveCamera,
  type PointLight,
} from "three";
import { MEDIA, cloudinaryModelUrl } from "@/config/mediaControl";

/* ===========================================================================
 * ASSETS
 * ======================================================================== */

/** Self-hosted Draco decoder — see public/draco/. The figure needs it. */
const DRACO_PATH = "/draco/";

const ASSETS = {
  tree: cloudinaryModelUrl(MEDIA.artScene.tree.src, {
    resourceType: MEDIA.artScene.tree.resourceType,
  }),
  mountain: cloudinaryModelUrl(MEDIA.artScene.mountain.src, {
    resourceType: MEDIA.artScene.mountain.resourceType,
  }),
  sun: cloudinaryModelUrl(MEDIA.artScene.sun.src, {
    resourceType: MEDIA.artScene.sun.resourceType,
  }),
  moon: cloudinaryModelUrl(MEDIA.artScene.moon.src, {
    resourceType: MEDIA.artScene.moon.resourceType,
  }),
  cloud: cloudinaryModelUrl(MEDIA.artScene.cloud.src, {
    resourceType: MEDIA.artScene.cloud.resourceType,
  }),
  kites: cloudinaryModelUrl(MEDIA.artScene.kites.src, {
    resourceType: MEDIA.artScene.kites.resourceType,
  }),
  figure: MEDIA.artScene.figure,
  raft: MEDIA.artScene.raft,
} as const;

/* ===========================================================================
 * THE WORLD — one unit is one metre
 * ======================================================================== */

/**
 * Scale is the story. The hero tree is 18 m; the figure is 62 cm — a mark
 * on the sand, not a character you could walk up to. The mountain is a
 * 160 m massif so the desert still has a vanishing point.
 */
const TREE_H = 18;
const FIGURE_H = 0.62;
const MOUNTAIN_H = 160;
const SUN_H = 32;
const MOON_H = 24;
const CLOUD_H = 9;
const KITE_H = 1.9;
/** Visible from the opening camera: a small boat, not a splinter. */
const RAFT_H = 2.6;

/** Sand at x > 0, sea at x < 0. The sea plane is oversized so fog, not
    geometry, is what ends the world. */
const SHORE = 0;
const DESERT_SPAN = 640;
const SEA_SPAN = 2400;
const SEA_Y = -0.25;

/** How quickly lighting, fog and water chase the day/night target. */
const PHASE_DAMPING = 2.15;

/** Local civil day: 06:00 inclusive through 18:00 exclusive. */
function isLocalDaytime(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18;
}

/* ===========================================================================
 * GROUND SAMPLER — declared above every caller, ON PURPOSE
 *
 * duneHeight() is a line-for-line port of duneField() in DESERT_VERT. The two
 * MUST stay in step: change a frequency in one and you must change it in the
 * other, or props float and sink. It is duplicated rather than shared because
 * one of them has to be GLSL.
 *
 * ORDER MATTERS. TREE_POS / FIGURE_POS / MOUNTAIN_POS below all call onSand()
 * at MODULE SCOPE. A `function` declaration hoists so the call resolves, but
 * SHORE_FLOOR_TS is a `const` — hoisted into the temporal dead zone, not
 * initialised. Declared after its callers this throws on module evaluation,
 * and TypeScript does not catch it.
 * ======================================================================== */

/** Same value as SHORE_FLOOR in DESERT_VERT. */
const SHORE_FLOOR_TS = 0.28;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Height of the sand at a world (x, z).
 *
 * Rescaled for the compact world: the old field ran to about 7 m of relief
 * over 200 m wavelengths, which was fine to look at from a fixed camera and
 * unwalkable on foot. This is ~1.8 m of relief over 15–70 m, so the ground
 * rolls under you instead of blocking you.
 */
function duneHeight(x: number, z: number) {
  const inland = smoothstep(0, 14, x);
  const base = 0.3 + smoothstep(0, 26, x) * 0.9;
  const a = Math.sin(x * 0.09 + z * 0.05) * 1.05;
  const b = Math.sin(x * 0.21 - z * 0.16) * 0.5;
  const c = Math.sin(x * 0.47 + z * 0.39) * 0.18;
  const berm = Math.exp(-Math.pow((x - 2.5) / 3, 2)) * 0.45;
  const h = base + (a + b + c) * inland + berm;
  const nearShore = 1 - smoothstep(22, 44, x);
  /* mix(h, max(h, SHORE_FLOOR), nearShore) */
  return h + (Math.max(h, SHORE_FLOOR_TS) - h) * nearShore;
}

/** Stand a prop on the sand at (x, z). `sink` beds it in. */
function onSand(x: number, z: number, sink = 0): [number, number, number] {
  return [x, duneHeight(x, z) - sink, z];
}

/* ===========================================================================
 * PLACEMENT — sea in the foreground, desert vanishing inland
 * ======================================================================== */

/** Orbit the shoreline: raft on the water, figure on the sand, trees behind. */
const ORBIT_TARGET: [number, number, number] = [7.2, 3.5, 2.6];
/** Opening camera: out over the water, looking back at the beach. */
const CAMERA_POS: [number, number, number] = [-16, 8, 12];
const CAMERA_POS_MOBILE: [number, number, number] = [-11, 6.5, 9];

/** Largest dry tree on the waterline. The figure stands in its shade. */
const TREE_POS = onSand(8.5, 2, 0.18);
const FIGURE_POS = onSand(6.9, 3.35, 0.02);

/**
 * On the water at the beach, in front of the bike. Grounded models sit on
 * their min.y, so y is the sea plane plus a hair of keel in the swell.
 */
const RAFT_POS: [number, number, number] = [-1.85, SEA_Y + 0.1, FIGURE_POS[2]];

/** Further barren trees along the same coast — a line, not a grove.
    Sink beds the roots into the sand so they read as planted, not hovering. */
const COAST_TREES = [
  { x: 6.2, z: 16, h: 0.62, rot: 1.8, sink: 0.16 },
  { x: 11.5, z: -11, h: 0.74, rot: 2.6, sink: 0.18 },
  { x: 5.0, z: -24, h: 0.52, rot: 4.1, sink: 0.14 },
  { x: 14.0, z: 28, h: 0.44, rot: 0.7, sink: 0.12 },
  { x: 9.5, z: -38, h: 0.68, rot: 5.2, sink: 0.16 },
  { x: 17.5, z: -6, h: 0.38, rot: 3.3, sink: 0.12 },
  { x: 7.8, z: 42, h: 0.5, rot: 1.15, sink: 0.14 },
  { x: 12.2, z: -52, h: 0.58, rot: 2.05, sink: 0.15 },
];

/** Far inland, solitary, large enough to own the horizon. */
const MOUNTAIN_POS = onSand(310, -28, 12);

/** Sun and moon hang over the sea so they read as the light of the world,
    not as ornaments parked behind the mountain. */
const SUN_POS = new Vector3(-92, 58, -48);
const MOON_POS = new Vector3(-78, 62, -36);

const CLOUDS = [
  { pos: [-24, 36, -22] as const, h: 1.6, speed: 0.22 },
  { pos: [18, 42, 14] as const, h: 2.2, speed: 0.16 },
  { pos: [-48, 34, 28] as const, h: 1.3, speed: 0.28 },
  { pos: [40, 48, -40] as const, h: 1.8, speed: 0.14 },
  { pos: [-8, 38, 46] as const, h: 1.1, speed: 0.2 },
];

/** Kites leave the hero tree and travel seaward (negative x). */
const KITE_COUNT = 7;

/* ===========================================================================
 * PALETTES
 * ======================================================================== */

const DAY = {
  fog: new Color("#8eb4d4"),
  fogDensity: 0.0032,
  sand: new Color("#cdae83"),
  sandShadow: new Color("#8f7355"),
  seaDeep: new Color("#2b4a63"),
  seaShallow: new Color("#7098ad"),
  seaSky: new Color("#8eb4d4"),
  key: new Color("#fff3da"),
  keyIntensity: 3.15,
  ambient: new Color("#9fb6cc"),
  ambientIntensity: 0.72,
} as const;

/**
 * Night is a black field with a single cool moon. Sand keeps a bruise of
 * indigo so the dunes do not vanish into the void; the key is #dbeafe and
 * the ambient is kept mean so shadows go long.
 */
const NIGHT = {
  fog: new Color("#000000"),
  fogDensity: 0.0046,
  sand: new Color("#1c1730"),
  sandShadow: new Color("#07050f"),
  seaDeep: new Color("#020510"),
  seaShallow: new Color("#0c1830"),
  seaSky: new Color("#000000"),
  key: new Color("#dbeafe"),
  keyIntensity: 2.4,
  ambient: new Color("#12182a"),
  ambientIntensity: 0.2,
} as const;

const GLOW_SAGE = new Color("#9caf88");
const GLOW_AMBER = new Color("#e8dc7a");

const DAY_MOTE_HEX = [
  "#f4a4b8",
  "#f2d08b",
  "#a78bfa",
  "#7dd3fc",
  "#fb7185",
  "#fde047",
] as const;
const NIGHT_MOTE_HEX = ["#e8dc7a", "#9caf88", "#f5e6a3", "#c5d4a0"] as const;

/* ===========================================================================
 * LIVE STATE
 *
 * Module-level because the animation loop writes it every frame and this
 * project's lint forbids both mutating a hook's return value and reading
 * ref.current during render. The trade is that the component is a SINGLETON —
 * two on one page would share a clock. Fine for a page hero.
 * ======================================================================== */

type Uniform<T> = { value: T };

/**
 * UniformsLib.fog is NOT optional. A raw shaderMaterial with `fog` set does
 * not get three's fog uniforms for free the way MeshStandardMaterial does, but
 * the renderer still writes fogColor.value every frame — so without them you
 * get a TypeError per frame per material and the terrain silently vanishes.
 */
function withFog<T extends Record<string, Uniform<unknown>>>(own: T) {
  return UniformsUtils.merge([UniformsLib.fog, own]) as T &
    Record<string, Uniform<unknown>>;
}

const STATE = {
  /** 0 = full day, 1 = full night. One ramp drives everything. */
  phase: isLocalDaytime() ? 0 : 1,
  /** Written by the overlay toggle; Clock damps `phase` toward this. */
  night: !isLocalDaytime(),
  desert: withFog({
    uSand: { value: DAY.sand.clone() },
    uShadow: { value: DAY.sandShadow.clone() },
    uLight: { value: 1 },
    uSunDir: { value: SUN_POS.clone().normalize() },
  }),
  sea: withFog({
    uTime: { value: 0 },
    uDeep: { value: DAY.seaDeep.clone() },
    uShallow: { value: DAY.seaShallow.clone() },
    uSky: { value: DAY.seaSky.clone() },
  }),
};

/** Reused every frame so the render loop allocates nothing. */
const SCRATCH = {
  colour: new Color(),
  ambient: new Color(),
  dayFog: DAY.fog.clone(),
  nightFog: NIGHT.fog.clone(),
  dummy: new Object3D(),
};

/** Deterministic PRNG — the lint bans Math.random during render, and a scene
    whose particles reshuffle every remount cannot be art-directed anyway. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ===========================================================================
 * MODEL LOADING
 * ======================================================================== */

function useGrounded(url: string, targetHeight: number) {
  const { scene } = useGLTF(url, DRACO_PATH, true);

  return useMemo(() => {
    /* useGLTF caches by URL and hands every caller the SAME object3d — four
       trees off one URL would be one tree teleporting between four places. */
    const object = scene.clone(true);
    object.traverse((child) => {
      const mesh = child as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    object.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const height = Number.isFinite(size.y) ? Math.max(size.y, 1e-4) : 1;
    const minY = Number.isFinite(box.min.y) ? box.min.y : 0;

    return {
      object,
      scale: targetHeight / height,
      offset: new Vector3(-centre.x, -minY, -centre.z),
    };
  }, [scene, targetHeight]);
}

class AssetBoundary extends React.Component<
  { label: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(
      `[ArtScene] "${this.props.label}" failed to load — the scene continues without it.`,
      error,
    );
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function GroundedModel({
  url,
  targetHeight,
  position,
  rotationY = 0,
  visible = true,
}: {
  url: string;
  targetHeight: number;
  position: readonly [number, number, number];
  rotationY?: number;
  visible?: boolean;
}) {
  const { object, scale, offset } = useGrounded(url, targetHeight);

  return (
    <group
      position={position as unknown as [number, number, number]}
      rotation={[0, rotationY, 0]}
      visible={visible}
    >
      <group position={offset.clone().multiplyScalar(scale)} scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}

/** Suspense + error boundary + grounding, in one wrapper. */
function Prop(
  props: React.ComponentProps<typeof GroundedModel> & { label: string },
) {
  const { label, url, targetHeight, ...rest } = props;
  return (
    <AssetBoundary key={`${label}:${url}:${targetHeight}`} label={label}>
      <Suspense fallback={null}>
        <GroundedModel url={url} targetHeight={targetHeight} {...rest} />
      </Suspense>
    </AssetBoundary>
  );
}

/* ===========================================================================
 * TERRAIN SHADER
 * ======================================================================== */

const DESERT_VERT = /* glsl */ `
  #include <fog_pars_vertex>

  varying float vHeight;
  varying vec2  vUv2;
  varying vec3  vNormalW;

  /* Must equal SHORE_FLOOR_TS in the TypeScript above. */
  const float SHORE_FLOOR = 0.28;

  float duneField(vec2 p) {
    float inland = smoothstep(0.0, 14.0, p.x);
    float base = 0.3 + smoothstep(0.0, 26.0, p.x) * 0.9;
    float a = sin(p.x * 0.09 + p.y * 0.05) * 1.05;
    float b = sin(p.x * 0.21 - p.y * 0.16) * 0.5;
    float c = sin(p.x * 0.47 + p.y * 0.39) * 0.18;
    float berm = exp(-pow((p.x - 2.5) / 3.0, 2.0)) * 0.45;
    float h = base + (a + b + c) * inland + berm;
    /* Clamp above the swell's crest wherever the sea plane reaches, or the
       water climbs over the sand and strands lagoons in the dunes. */
    float nearShore = 1.0 - smoothstep(22.0, 44.0, p.x);
    return mix(h, max(h, SHORE_FLOOR), nearShore);
  }

  /* Analytic normal by sampling twice more and crossing the tangents, built
     in WORLD space so the plane's -90 degree rotation cannot flip a sign. */
  vec3 duneNormalWorld(vec2 w) {
    float e = 0.35;
    float h  = duneField(w);
    float hx = duneField(w + vec2(e, 0.0));
    float hz = duneField(w + vec2(0.0, e));
    return normalize(cross(vec3(0.0, hz - h, e), vec3(e, hx - h, 0.0)));
  }

  void main() {
    vec3 p = position;
    /* WORLD coordinates. The mesh is offset along x so its edge lands on the
       shoreline, so local x is NOT world x — feeding local x to smoothstep
       switches the dune field off across the whole near half. */
    vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
    vec2 world = vec2(wp.x, wp.z);

    float h = duneField(world);
    p.z += h;
    vHeight = h;
    vUv2 = world;
    vNormalW = duneNormalWorld(world);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const DESERT_FRAG = /* glsl */ `
  #include <fog_pars_fragment>

  uniform vec3  uSand;
  uniform vec3  uShadow;
  uniform float uLight;
  uniform vec3  uSunDir;

  varying float vHeight;
  varying vec2  vUv2;
  varying vec3  vNormalW;

  void main() {
    /* Biased so FLAT sand sits near the top of the range. Centred on zero,
       every unmodulated stretch resolves to the shadow colour and the desert
       reads as mud. */
    float crest = smoothstep(-1.0, 1.4, vHeight);
    vec3 sand = mix(uShadow, uSand, crest);

    float wet = 1.0 - smoothstep(0.0, 3.0, vUv2.x);
    sand = mix(sand, sand * 0.78, wet * 0.7);

    /* Generous ambient floor: full Lambert would black out every slope facing
       away from the key light, and the sky is a light source here too. */
    vec3 n = normalize(vNormalW);
    float lambert = 0.58 + 0.42 * max(dot(n, normalize(uSunDir)), 0.0);

    gl_FragColor = vec4(sand * lambert * uLight, 1.0);

    #include <fog_fragment>
  }
`;

function Desert() {
  useFrame(() => {
    const t = STATE.phase;
    const u = STATE.desert;
    (u.uSand.value as Color).copy(DAY.sand).lerp(NIGHT.sand, t);
    (u.uShadow.value as Color).copy(DAY.sandShadow).lerp(NIGHT.sandShadow, t);
    u.uLight.value = MathUtils.lerp(1, 0.55, t);
    (u.uSunDir.value as Vector3)
      .copy(t < 0.5 ? SUN_POS : MOON_POS)
      .normalize();
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[SHORE + DESERT_SPAN / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[DESERT_SPAN, DESERT_SPAN, 280, 280]} />
      <shaderMaterial
        vertexShader={DESERT_VERT}
        fragmentShader={DESERT_FRAG}
        uniforms={STATE.desert}
        fog
      />
    </mesh>
  );
}

/* ===========================================================================
 * THE SEA
 * ======================================================================== */

const SEA_VERT = /* glsl */ `
  #include <fog_pars_vertex>

  uniform float uTime;

  varying float vSwell;
  varying vec3  vWorld;

  void main() {
    vec3 p = position;
    vec2 world = vec2(p.x, p.y);

    /* Deliberately small: a calm sea. Visible chop would fight the mood, and
       at eye level any real amplitude would also poke through the beach. */
    float s =
      sin(world.y * 0.09 + uTime * 0.5) * 0.09 +
      sin(world.x * 0.06 - uTime * 0.31) * 0.06;

    p.z += s;
    vSwell = s;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const SEA_FRAG = /* glsl */ `
  #include <fog_pars_fragment>

  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;

  varying float vSwell;
  varying vec3  vWorld;

  void main() {
    /* Grazing angles reflect the sky, steep angles show the water's colour.
       This one term is most of what makes a flat plane read as water. */
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 3.0);

    vec3 water = mix(uDeep, uShallow, smoothstep(-0.12, 0.12, vSwell));
    vec3 col = mix(water, uSky, fresnel * 0.85);

    float surf = 1.0 - smoothstep(0.0, 2.5, abs(vWorld.x));
    col = mix(col, uSky, surf * 0.3);

    gl_FragColor = vec4(col, 1.0);

    #include <fog_fragment>
  }
`;

function Sea() {
  useFrame((state) => {
    const t = STATE.phase;
    const u = STATE.sea;
    u.uTime.value = state.clock.elapsedTime;
    (u.uDeep.value as Color).copy(DAY.seaDeep).lerp(NIGHT.seaDeep, t);
    (u.uShallow.value as Color).copy(DAY.seaShallow).lerp(NIGHT.seaShallow, t);
    (u.uSky.value as Color).copy(DAY.seaSky).lerp(NIGHT.seaSky, t);
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[SHORE - SEA_SPAN / 2 + 8, SEA_Y, 0]}
    >
      <planeGeometry args={[SEA_SPAN, SEA_SPAN, 96, 96]} />
      <shaderMaterial
        vertexShader={SEA_VERT}
        fragmentShader={SEA_FRAG}
        uniforms={STATE.sea}
        fog
        side={DoubleSide}
      />
    </mesh>
  );
}

/* ===========================================================================
 * DAY / NIGHT CLOCK
 * ======================================================================== */

/**
 * Chases STATE.night. Real time (and the overlay button) only write the
 * boolean; this is what actually crossfades fog, water, sand and lights.
 */
function Clock() {
  const fog = useRef<FogExp2>(null);
  const background = useRef<Color>(null);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const target = STATE.night ? 1 : 0;
    STATE.phase = MathUtils.damp(STATE.phase, target, PHASE_DAMPING, delta);

    if (fog.current) {
      fog.current.color
        .copy(SCRATCH.dayFog)
        .lerp(SCRATCH.nightFog, STATE.phase);
      fog.current.density = MathUtils.lerp(
        DAY.fogDensity,
        NIGHT.fogDensity,
        STATE.phase,
      );
      background.current?.copy(fog.current.color);
    }
  });

  return (
    <>
      <fogExp2
        ref={fog}
        attach="fog"
        args={[
          STATE.night ? NIGHT.fog : DAY.fog,
          STATE.night ? NIGHT.fogDensity : DAY.fogDensity,
        ]}
      />
      <color
        ref={background}
        attach="background"
        args={[STATE.night ? NIGHT.fog : DAY.fog]}
      />
    </>
  );
}

/* ===========================================================================
 * ORBIT — 360° look-around, no walking
 * ======================================================================== */

function DioramaControls() {
  const width = useThree((s) => s.size.width);
  const mobile = width < 768;

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.048}
      enableRotate
      enableZoom
      enablePan={!mobile}
      /* Full yaw so you can walk a circle around the beach. Polar stays
         above the sand so the camera cannot flip under the world. */
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={mobile ? 5 : 8}
      maxDistance={mobile ? 140 : 320}
      target={ORBIT_TARGET}
      rotateSpeed={mobile ? 0.85 : 1.05}
      zoomSpeed={mobile ? 0.75 : 1}
      autoRotate={false}
    />
  );
}

/**
 * Closer, wider shot on small screens so the raft and figure stay in frame
 * without requiring a pinch-zoom. Mutates a camera we own, not useThree().
 */
function Shot() {
  const width = useThree((s) => s.size.width);
  const mobile = width < 768;
  const camera = useRef<ThreePerspectiveCamera>(null);
  const pos = mobile ? CAMERA_POS_MOBILE : CAMERA_POS;

  useLayoutEffect(() => {
    const cam = camera.current;
    if (!cam) return;
    cam.lookAt(ORBIT_TARGET[0], ORBIT_TARGET[1], ORBIT_TARGET[2]);
  }, [mobile]);

  return (
    <PerspectiveCamera
      ref={camera}
      makeDefault
      fov={mobile ? 56 : 42}
      position={pos}
      near={0.15}
      far={3200}
    />
  );
}

/* ===========================================================================
 * LIGHTING
 * ======================================================================== */

function SceneLights() {
  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const sage = useRef<PointLight>(null);
  const amber = useRef<PointLight>(null);
  const raftGlow = useRef<PointLight>(null);

  useFrame(() => {
    const t = STATE.phase;

    if (ambient.current) {
      ambient.current.color.copy(DAY.ambient).lerp(NIGHT.ambient, t);
      ambient.current.intensity = MathUtils.lerp(
        DAY.ambientIntensity,
        NIGHT.ambientIntensity,
        t,
      );
    }

    if (key.current) {
      key.current.color.copy(DAY.key).lerp(NIGHT.key, t);
      key.current.intensity = MathUtils.lerp(
        DAY.keyIntensity,
        NIGHT.keyIntensity,
        t,
      );
      /* The key light travels with whichever body is in the sky. */
      key.current.position.copy(SUN_POS).lerp(MOON_POS, t);
    }

    /* Sage and amber are night-only. Squared so they ease in with dusk. */
    const glow = t * t;
    if (sage.current) sage.current.intensity = glow * 14;
    if (amber.current) amber.current.intensity = glow * 18;
    if (raftGlow.current) raftGlow.current.intensity = glow * 10;
  });

  return (
    <>
      <ambientLight ref={ambient} />
      <directionalLight
        ref={key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-camera-near={1}
        shadow-camera-far={520}
        shadow-bias={-0.0006}
      />

      {/* Night-only pools of sage and amber around the trees — firefly light,
          not carnival neon. */}
      <pointLight
        ref={sage}
        position={[TREE_POS[0] - 2, TREE_POS[1] + 3.4, TREE_POS[2] + 1.5]}
        color={GLOW_SAGE}
        distance={28}
        decay={2}
      />
      <pointLight
        ref={amber}
        position={[TREE_POS[0] + 4, TREE_POS[1] + 2.2, TREE_POS[2] - 4]}
        color={GLOW_AMBER}
        distance={24}
        decay={2}
      />
      <pointLight
        ref={raftGlow}
        position={[RAFT_POS[0], RAFT_POS[1] + 1.1, RAFT_POS[2]]}
        color={GLOW_AMBER}
        distance={14}
        decay={2}
      />
    </>
  );
}

/* ===========================================================================
 * KITES — rise from the hero tree and travel toward the sea horizon.
 * Hidden at night: letting go is a daylight act.
 * ======================================================================== */

function Kites() {
  const { object, scale, offset } = useGrounded(ASSETS.kites, KITE_H);
  const group = useRef<Group>(null);

  const kites = useMemo(() => {
    const r = rng(0x1e5c);
    return Array.from({ length: KITE_COUNT }, (_, i) => ({
      node: object.clone(true),
      phase: i / KITE_COUNT,
      /* Seconds to cross from the tree to the far water. */
      duration: 28 + r() * 18,
      lift: TREE_H * (0.55 + r() * 0.5),
      driftZ: (r() - 0.5) * 36,
      spin: 0.35 + r() * 0.55,
    }));
  }, [object]);

  useFrame((state) => {
    const node = group.current;
    if (!node) return;
    const t = state.clock.elapsedTime;
    /* Day visibility. Soft so they dissolve rather than pop. */
    const day = 1 - STATE.phase;
    const show = day > 0.06;

    node.children.forEach((child, i) => {
      const k = kites[i];
      if (!k) return;
      child.visible = show;
      if (!show) return;

      const life = ((t + k.phase * k.duration) % k.duration) / k.duration;
      const ease = 1 - Math.pow(1 - life, 1.35);
      child.position.set(
        TREE_POS[0] - 1 - ease * 95,
        TREE_POS[1] + 2.2 + k.lift * ease + Math.sin(t * 0.7 + i) * 0.8,
        TREE_POS[2] + k.driftZ * ease + Math.sin(t * 0.25 + i) * 1.4,
      );
      child.rotation.set(
        Math.sin(t * k.spin + i) * 0.35,
        Math.PI * 0.5 + ease * 0.4,
        Math.sin(t * k.spin * 1.3 + i) * 0.45,
      );
      child.scale.setScalar(scale * day * (0.85 + life * 0.4));
    });
  });

  return (
    <group ref={group}>
      {kites.map((k, i) => (
        <group key={i} position={offset.clone().multiplyScalar(scale)}>
          <primitive object={k.node} />
        </group>
      ))}
    </group>
  );
}

/* ===========================================================================
 * MOTES — butterflies by day, fireflies by night
 * ======================================================================== */

const MOTE_COUNT = 140;

function Motes() {
  const mesh = useRef<InstancedMesh>(null);

  const seeds = useMemo(() => {
    const r = rng(0x5eed);
    const anchors = [
      { x: TREE_POS[0], z: TREE_POS[2] },
      ...COAST_TREES.map((t) => ({ x: t.x, z: t.z })),
    ];
    return Array.from({ length: MOTE_COUNT }, () => {
      const anchor = anchors[Math.floor(r() * anchors.length)] ?? anchors[0];
      const dayHex = DAY_MOTE_HEX[Math.floor(r() * DAY_MOTE_HEX.length)] ?? "#f4a4b8";
      const nightHex =
        NIGHT_MOTE_HEX[Math.floor(r() * NIGHT_MOTE_HEX.length)] ?? "#9caf88";
      return {
        origin: new Vector3(
          anchor.x + (r() - 0.5) * 12,
          duneHeight(anchor.x, anchor.z) + 0.5 + r() * TREE_H * 0.7,
          anchor.z + (r() - 0.5) * 12,
        ),
        radius: 0.5 + r() * 2.2,
        speed: 0.22 + r() * 0.7,
        drift: r() * Math.PI * 2,
        bob: 0.3 + r() * 0.9,
        day: new Color(dayHex),
        night: new Color(nightHex),
      };
    });
  }, []);

  useFrame((state) => {
    const node = mesh.current;
    if (!node) return;

    const t = state.clock.elapsedTime;
    const p = STATE.phase;
    const { dummy, colour } = SCRATCH;

    seeds.forEach((s, i) => {
      const a = s.drift + t * s.speed;
      dummy.position.set(
        s.origin.x + Math.cos(a) * s.radius,
        /* Butterflies flit; fireflies drift. The two frequencies blend by phase. */
        s.origin.y +
          Math.sin(t * (2.6 - p * 2.1) + s.drift) * s.bob * (1 - p * 0.45),
        s.origin.z + Math.sin(a * 1.3) * s.radius,
      );
      dummy.scale.setScalar(MathUtils.lerp(0.055, 0.08, p));
      dummy.rotation.set(0, a, Math.sin(t * 6 + i) * 0.7 * (1 - p));
      dummy.updateMatrix();
      node.setMatrixAt(i, dummy.matrix);
      colour.copy(s.day).lerp(s.night, p);
      node.setColorAt(i, colour);
    });

    node.instanceMatrix.needsUpdate = true;
    if (node.instanceColor) node.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, MOTE_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      {/* Additive, so the night pass glows without a bloom pass. */}
      <meshBasicMaterial
        transparent
        opacity={0.95}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ===========================================================================
 * SKY — day and night, crossfaded by opacity where possible
 * ======================================================================== */

function SkyLayer() {
  const [isNight, setIsNight] = useState(() => STATE.phase > 0.5);

  /* drei's <Sky> and <Stars> are not cheap to re-create, so they are swapped
     on a coarse boolean rather than driven per frame. The colour crossfade
     that carries the transition is the fog and the lights, which are
     continuous — this only decides which backdrop is mounted. */
  useFrame(() => {
    const night = STATE.phase > 0.5;
    if (night !== isNight) setIsNight(night);
  });

  return (
    <>
      {!isNight && (
        <Sky
          distance={9000}
          sunPosition={[SUN_POS.x / 14, SUN_POS.y / 14, SUN_POS.z / 14]}
          turbidity={4.8}
          rayleigh={2.6}
          mieCoefficient={0.005}
          mieDirectionalG={0.82}
        />
      )}

      {isNight && (
        <Stars
          radius={420}
          depth={140}
          count={12000}
          factor={5.5}
          saturation={0.15}
          fade
          speed={0.25}
        />
      )}

      <Prop
        label="sun"
        url={ASSETS.sun}
        targetHeight={SUN_H}
        position={[SUN_POS.x, SUN_POS.y, SUN_POS.z]}
        visible={!isNight}
      />
      <Prop
        label="moon"
        url={ASSETS.moon}
        targetHeight={MOON_H}
        position={[MOON_POS.x, MOON_POS.y, MOON_POS.z]}
        visible={isNight}
      />
    </>
  );
}

/* ===========================================================================
 * LOADER
 * ======================================================================== */

function SceneLoader() {
  const { progress } = useProgress();

  return (
    <Html center style={{ pointerEvents: "none" }}>
      <div className="flex flex-col items-center gap-3 text-white">
        <span className="font-sans text-[0.6rem] tracking-[0.32em] text-white/45 uppercase">
          Crossing
        </span>
        <p className="font-display m-0 text-2xl tracking-wide">
          {Math.round(progress)}%
        </p>
        <span aria-hidden="true" className="h-px w-24 bg-white/30" />
      </div>
    </Html>
  );
}

/** Daylight clouds that crawl toward the sea and dissolve after dusk. */
function DriftCloud({
  pos,
  h,
  speed,
  index,
}: {
  pos: readonly [number, number, number];
  h: number;
  speed: number;
  index: number;
}) {
  const wrap = useRef<Group>(null);

  useFrame((state) => {
    const node = wrap.current;
    if (!node) return;
    const day = 1 - STATE.phase;
    node.visible = day > 0.1;
    const travel = 70;
    const x = pos[0] - ((state.clock.elapsedTime * speed * 2.4 + index * 11) % travel);
    node.position.set(x, pos[1], pos[2]);
  });

  return (
    <group ref={wrap} position={pos as unknown as [number, number, number]}>
      <Float
        speed={speed}
        rotationIntensity={0.04}
        floatIntensity={1.2}
        floatingRange={[-1.4, 1.4]}
      >
        <Prop
          label={`cloud ${index + 1}`}
          url={ASSETS.cloud}
          targetHeight={CLOUD_H * h}
          position={[0, 0, 0]}
        />
      </Float>
    </group>
  );
}

/** Sage sparkles among the trees — night only. */
function NightHaze() {
  const [isNight, setIsNight] = useState(() => STATE.phase > 0.5);

  useFrame(() => {
    const night = STATE.phase > 0.45;
    if (night !== isNight) setIsNight(night);
  });

  if (!isNight) return null;

  return (
    <Sparkles
      count={160}
      scale={[40, 14, 40]}
      position={[TREE_POS[0], TREE_POS[1] + 5, TREE_POS[2]]}
      size={2.4}
      speed={0.22}
      opacity={0.7}
      color="#c5d4a0"
    />
  );
}

/** Raft sits on the sea at the beach and rides the swell. */
function RaftOnWater() {
  const wrap = useRef<Group>(null);

  useFrame((state) => {
    const node = wrap.current;
    if (!node) return;
    const t = state.clock.elapsedTime;
    node.position.y = RAFT_POS[1] + Math.sin(t * 0.55) * 0.05;
    node.rotation.z = Math.sin(t * 0.42) * 0.02;
    node.rotation.x = Math.cos(t * 0.31) * 0.014;
  });

  return (
    <group ref={wrap} position={RAFT_POS}>
      <Prop
        label="raft"
        url={ASSETS.raft}
        targetHeight={RAFT_H}
        position={[0, 0, 0]}
        rotationY={1.15}
      />
    </group>
  );
}

/* ===========================================================================
 * SCENE
 * ======================================================================== */

function Scene() {
  return (
    <>
      <Clock />
      <Shot />
      <SceneLights />
      <SkyLayer />

      <Desert />
      <Sea />

      {/* ---------- INLAND: THE SOLITARY MOUNTAIN ---------- */}
      <Prop
        label="desert mountain"
        url={ASSETS.mountain}
        targetHeight={MOUNTAIN_H}
        position={MOUNTAIN_POS}
        rotationY={0.85}
      />

      {/* ---------- BEACH WATER: THE RAFT ---------- */}
      <RaftOnWater />

      {/* ---------- COAST: THE DRY TREES + THE TINY FIGURE ---------- */}
      <Prop
        label="dry tree (hero)"
        url={ASSETS.tree}
        targetHeight={TREE_H}
        position={TREE_POS}
        rotationY={0.35}
      />
      <Prop
        label="figure"
        url={ASSETS.figure}
        targetHeight={FIGURE_H}
        position={FIGURE_POS}
        rotationY={-0.7}
      />

      {COAST_TREES.map((t, i) => (
        <Prop
          key={i}
          label={`dry tree ${i + 2}`}
          url={ASSETS.tree}
          targetHeight={TREE_H * t.h}
          position={onSand(t.x, t.z, t.sink)}
          rotationY={t.rot}
        />
      ))}

      {/* ---------- CLOUDS — daylight only, drifting toward the sea ---------- */}
      {CLOUDS.map((c, i) => (
        <DriftCloud key={i} {...c} index={i} />
      ))}

      {/* ---------- KITES ---------- */}
      <AssetBoundary key="kites-grounded" label="kites">
        <Suspense fallback={null}>
          <Kites />
        </Suspense>
      </AssetBoundary>

      <Motes />

      <NightHaze />

      <DioramaControls />
      <AdaptiveDpr pixelated />
    </>
  );
}

/* ===========================================================================
 * PAGE-LEVEL BOUNDARY
 * ======================================================================== */

class SceneBoundary extends React.Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[ArtScene] scene failed:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#0d0725] px-6 text-center"
        role="alert"
      >
        <p className="font-sans text-[0.6rem] tracking-[0.28em] text-white/40 uppercase">
          The coast is not available right now
        </p>
        <button
          type="button"
          onClick={() => this.setState({ failed: false })}
          className="min-h-11 rounded-full border-2 border-[#f6efe2] bg-[#f6efe2] px-5 font-sans text-[0.68rem] tracking-[0.22em] text-black uppercase"
        >
          Try again
        </button>
      </div>
    );
  }
}

/* ===========================================================================
 * PUBLIC COMPONENT
 * ======================================================================== */

const POEM = [
  "Footprints fade in the whispering sand,",
  "Where the dry wood meets the endless sea.",
  "Sun and moon dance hand in hand,",
  "In this silent world, meant just for me.",
] as const;

export interface ArtLonelinessSceneProps {
  className?: string;
}

export default function ArtLonelinessScene({
  className = "h-[86svh] w-full",
}: ArtLonelinessSceneProps) {
  const [isNight, setIsNight] = useState(() => {
    const night = !isLocalDaytime();
    STATE.night = night;
    STATE.phase = night ? 1 : 0;
    return night;
  });

  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <SceneBoundary key="art-diorama-v4">
        <Canvas
          dpr={[1, 1.5]}
          shadows
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          className="touch-none h-full w-full"
        >
          <Suspense fallback={<SceneLoader />}>
            <Scene />
          </Suspense>
        </Canvas>
      </SceneBoundary>

      {/* Poem must not steal orbit drags or the day/night control. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-16 lg:pb-20">
        <blockquote className="max-w-lg text-center">
          <p
            className="font-display text-[clamp(0.82rem,3.4vw,1.35rem)] leading-[1.75] font-normal tracking-[0.01em] text-balance italic sm:leading-[1.85]"
            style={{
              color: "#f6efe2",
              textShadow:
                "0 2px 14px rgba(0,0,0,0.75), 0 0 34px rgba(0,0,0,0.5)",
            }}
          >
            {POEM.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </blockquote>
      </div>

      <div
        role="group"
        aria-label="Time of day"
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-30 flex flex-col items-stretch gap-1 rounded-2xl border-2 border-[#f6efe2] bg-black/80 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.65)] backdrop-blur-md sm:top-6 sm:right-6 sm:p-2"
      >
        <p className="px-2 pt-1 text-center font-sans text-[0.58rem] tracking-[0.28em] text-[#f6efe2] uppercase sm:text-[0.62rem]">
          Sky
        </p>
        <div className="flex">
          <button
            type="button"
            onClick={() => {
              STATE.night = false;
              setIsNight(false);
            }}
            aria-pressed={!isNight}
            className={`min-h-12 min-w-20 rounded-xl px-4 font-sans text-[0.72rem] tracking-[0.2em] uppercase sm:min-h-12 sm:min-w-24 sm:text-[0.78rem] ${
              isNight
                ? "text-[#f6efe2]/70 hover:text-[#f6efe2]"
                : "bg-[#f6efe2] text-black"
            }`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => {
              STATE.night = true;
              setIsNight(true);
            }}
            aria-pressed={isNight}
            className={`min-h-12 min-w-20 rounded-xl px-4 font-sans text-[0.72rem] tracking-[0.2em] uppercase sm:min-h-12 sm:min-w-24 sm:text-[0.78rem] ${
              isNight
                ? "bg-[#f6efe2] text-black"
                : "text-[#f6efe2]/70 hover:text-[#f6efe2]"
            }`}
          >
            Night
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * PREFETCH — the ground-level models only. The sky bodies and clouds arrive
 * during the first cycle and are not needed for the opening frame.
 * ------------------------------------------------------------------------ */

useGLTF.preload(ASSETS.tree, DRACO_PATH, true);
useGLTF.preload(ASSETS.mountain, DRACO_PATH, true);
useGLTF.preload(ASSETS.figure, DRACO_PATH, true);
useGLTF.preload(ASSETS.raft, DRACO_PATH, true);
