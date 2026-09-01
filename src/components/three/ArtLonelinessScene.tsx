"use client";

/**
 * ============================================================================
 *  ART — LONELINESS SCENE  ·  first-person walk
 * ============================================================================
 *
 *  A compact desert headland you walk around in first person. The mountain
 *  stands in the back centre, a dead tree and a bike in the foreground, kites
 *  overhead, and the sky cycles from day to night on its own.
 *
 *  ---------------------------------------------------------------------------
 *  THE WORLD IS NOW IN METRES, AND THAT IS THE WHOLE REFACTOR
 *  ---------------------------------------------------------------------------
 *  The previous version was a landscape you looked AT: a 1600-unit desert, a
 *  90-unit mountain 480 units away, a figure deliberately too small to read.
 *  First person breaks all of that, because the moment there is a body in the
 *  scene every distance is measured against it.
 *
 *  So one unit is one metre and EYE_HEIGHT is 1.7. Everything else follows
 *  from that: the tree is 7 m, the bike 1.8 m (a person's height — it is
 *  standing beside the tree now, not hiding in the sand), the mountain 46 m
 *  and 130 m out rather than 480. Distances shrank by roughly 4x and the
 *  scene reads as dense instead of empty.
 *
 *  The dune field was rescaled to match. At the old amplitudes you would have
 *  been climbing seven-metre sand walls every few steps; the wavelengths are
 *  now short and the amplitude about 1.8 m total, which walks like ground.
 *
 *  ---------------------------------------------------------------------------
 *  WALKING: WHY THE CONTROLS REF AND NOT THE CAMERA
 *  ---------------------------------------------------------------------------
 *  Movement goes through `controls.current.moveForward()` / `moveRight()`
 *  rather than touching camera.position directly. Two reasons, one aesthetic
 *  and one mechanical.
 *
 *  I read three-stdlib's implementation (drei wraps that, NOT three's own
 *  examples version — the two have different APIs, and it is `controls.camera`
 *  and `getObject()` here, not `object`). Its moveForward takes column 0 of
 *  the camera matrix and crosses it with camera.up, which yields a strictly
 *  HORIZONTAL forward vector. Roll the mouse up and you still walk along the
 *  ground instead of flying — exactly the FPS feel you want, and something you
 *  would have to write yourself if you moved the camera by hand.
 *
 *  The mechanical reason: this project's React Compiler lint forbids mutating
 *  anything returned from a hook, which rules out `useThree().camera.position
 *  .add(...)`. Calling a method on an instance held in our own ref is fine.
 *
 *  ---------------------------------------------------------------------------
 *  POINTER LOCK IS OPT-IN, AND HAS TO BE
 *  ---------------------------------------------------------------------------
 *  This canvas sits in the middle of a scrolling page with a nav above it.
 *  Auto-locking would trap the cursor the instant the section scrolled into
 *  view — the visitor could not scroll, could not reach the nav, and would not
 *  know Esc was the way out.
 *
 *  So nothing locks until you click the prompt, WASD is ignored unless the
 *  pointer is actually locked, and the prompt says how to leave. Browsers also
 *  require a user gesture for requestPointerLock, so this is the only shape
 *  that works anyway.
 *
 *  ---------------------------------------------------------------------------
 *  STILL TRUE FROM BEFORE
 *  ---------------------------------------------------------------------------
 *  · Every remote model is individually fenced — Suspense AND an error
 *    boundary each. One failed GLB costs you that model, not the page. An
 *    uncaught throw in an R3F tree unmounts everything; I have measured that
 *    on this project (ten <section> elements before, zero after).
 *  · Nothing hardcodes a model scale. useGrounded() measures each GLB's own
 *    bounding box and scales it to a target height in metres.
 *  · Props stand on duneHeight(), not on y=0. The sand is a displaced shader;
 *    anything placed at zero is buried.
 *  · The helper block sits ABOVE its callers. duneHeight is a hoisted
 *    function but SHORE_FLOOR_TS is a const, and a const declared below a
 *    module-scope caller throws "cannot access before initialization".
 * ============================================================================
 */

import * as React from "react";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Float,
  Html,
  PointerLockControls,
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
  type Camera,
  type DirectionalLight,
  type FogExp2,
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
} as const;

/* ===========================================================================
 * THE WORLD — one unit is one metre
 * ======================================================================== */

const EYE_HEIGHT = 1.7;

/** Walking speed, m/s. Sprint multiplier on Shift. */
const WALK_SPEED = 6.5;
const SPRINT_MULTIPLIER = 2.1;
/** How fast the velocity catches up to the input. Higher = twitchier. */
const MOVE_DAMPING = 9;

/** Model heights, in metres. */
const TREE_H = 7;
const FIGURE_H = 1.8;
const MOUNTAIN_H = 46;
const SUN_H = 9;
const MOON_H = 7;
const CLOUD_H = 5;
const KITE_H = 1.6;

/** Sand at x > 0, sea at x < 0. */
const SHORE = 0;
const DESERT_SPAN = 420;
const SEA_SPAN = 1400;
const SEA_Y = -0.25;

/** Seconds for a full day → night → day. */
const CYCLE_SECONDS = 72;

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
 * PLACEMENT — compact, and composed around where you start standing
 * ======================================================================== */

/** Where the walk begins, and what it is aimed at. */
const START_XZ: [number, number] = [13, 15];
const LOOK_AT = new Vector3(2, 5, -40);

/** Foreground: the dead tree, with the bike stood beside it. */
const TREE_POS = onSand(7, 1, 0.25);
const FIGURE_POS = onSand(4.6, 3.4, 0.05);

/** A few more trees, close in, so the headland feels populated. */
const EXTRA_TREES = [
  { x: 16, z: -9, h: 0.72, rot: 2.1, sink: 0.2 },
  { x: 4, z: -19, h: 0.58, rot: 4.3, sink: 0.18 },
  { x: 22, z: -30, h: 0.5, rot: 1.2, sink: 0.18 },
];

/** Back centre, on the axis you start out facing. */
const MOUNTAIN_POS = onSand(2, -130, 2.4);

/** Sky bodies — high, and behind the mountain so they read as sky, not props. */
const SUN_POS = new Vector3(-22, 58, -104);
const MOON_POS = new Vector3(-18, 54, -98);

/** Clouds sit BELOW the sun and moon, per the brief. */
const CLOUDS = [
  { pos: [-14, 30, -74] as const, h: 1.5, speed: 0.35 },
  { pos: [14, 34, -92] as const, h: 2.0, speed: 0.28 },
  { pos: [-30, 26, -52] as const, h: 1.2, speed: 0.42 },
];

/** Kites, high enough to read clearly against the sky. */
const KITE_COUNT = 5;
const KITE_BASE = new Vector3(6, 20, -26);

/* ===========================================================================
 * PALETTES
 * ======================================================================== */

const DAY = {
  fog: new Color("#bcd0e0"),
  fogDensity: 0.0062,
  sand: new Color("#cdae83"),
  sandShadow: new Color("#8f7355"),
  seaDeep: new Color("#2b4a63"),
  seaShallow: new Color("#7098ad"),
  seaSky: new Color("#bcd0e0"),
  key: new Color("#fff3da"),
  keyIntensity: 2.5,
  ambient: new Color("#9fb6cc"),
  ambientIntensity: 0.8,
} as const;

/**
 * Night is a FANTASY night, not a dark one. The sand goes indigo rather than
 * black, and three coloured point lights — magenta, cyan, violet — sit low
 * among the trees. Keeping some saturation in the ambient is what stops the
 * coloured lights reading as stray glows on a black screen.
 */
const NIGHT = {
  fog: new Color("#0d0725"),
  fogDensity: 0.0088,
  sand: new Color("#3b2f66"),
  sandShadow: new Color("#180f33"),
  seaDeep: new Color("#0a0a2e"),
  seaShallow: new Color("#2a1d6b"),
  seaSky: new Color("#160e38"),
  key: new Color("#cfd8ff"),
  keyIntensity: 1.5,
  ambient: new Color("#3a2a6e"),
  ambientIntensity: 0.55,
} as const;

const GLOW_MAGENTA = new Color("#ff3ea5");
const GLOW_CYAN = new Color("#22d3ee");
const GLOW_VIOLET = new Color("#a855f7");

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
  phase: 0,
  /** True while the pointer is locked; gates WASD. */
  locked: false,
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

/** Held down right now. Written by the key listeners, read in useFrame. */
const KEYS = { f: false, b: false, l: false, r: false, sprint: false };

/**
 * The live PointerLockControls instance.
 *
 * A module object rather than a ref passed down as a prop, because the lint
 * draws a sharp line here: mutating a ref you CREATED is fine, mutating one
 * that arrived as a PROP is "modifying component props". The lock button lives
 * outside the Canvas and the movement loop lives inside it, so a shared ref
 * would have to cross that boundary as a prop either way. A module holder side-
 * steps it, and this component is already a documented singleton.
 */
const CONTROLS: { current: FirstPersonControls | null } = { current: null };

/** Reused every frame so the render loop allocates nothing. */
const SCRATCH = {
  colour: new Color(),
  ambient: new Color(),
  dayFog: DAY.fog.clone(),
  nightFog: NIGHT.fog.clone(),
  dummy: new Object3D(),
  moteDay: new Color("#f7b7cd"),
  moteNight: new Color("#67e8f9"),
  velocity: new Vector3(),
  input: new Vector3(),
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
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const height = Number.isFinite(size.y) ? Math.max(size.y, 1e-4) : 1;

    return {
      object,
      scale: targetHeight / height,
      offset: new Vector3(
        -centre.x,
        Number.isFinite(box.min.y) ? -box.min.y : 0,
        -centre.z,
      ),
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
      <group scale={scale} position={offset.clone().multiplyScalar(scale)}>
        <primitive object={object} />
      </group>
    </group>
  );
}

/** Suspense + error boundary + grounding, in one wrapper. */
function Prop(
  props: React.ComponentProps<typeof GroundedModel> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <AssetBoundary label={label}>
      <Suspense fallback={null}>
        <GroundedModel {...rest} />
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
    u.uLight.value = MathUtils.lerp(1, 0.92, t);
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
      <planeGeometry args={[DESERT_SPAN, DESERT_SPAN, 340, 340]} />
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
      <planeGeometry args={[SEA_SPAN, SEA_SPAN, 80, 80]} />
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
 * FIRST-PERSON MOVEMENT
 * ======================================================================== */

type FirstPersonControls = {
  isLocked: boolean;
  camera: Camera;
  moveForward: (d: number) => void;
  moveRight: (d: number) => void;
  lock: () => void;
};

const KEY_MAP: Record<string, keyof typeof KEYS> = {
  KeyW: "f",
  ArrowUp: "f",
  KeyS: "b",
  ArrowDown: "b",
  KeyA: "l",
  ArrowLeft: "l",
  KeyD: "r",
  ArrowRight: "r",
};

/**
 * WASD, with the camera glued to the sand.
 *
 * Velocity is damped rather than set outright — instant start/stop feels like
 * a debug flycam, and about 110 ms of ramp is what reads as "walking".
 *
 * Keys are only read while the pointer is locked. Without that gate, arrow
 * keys and W would be swallowed from the rest of the page whenever this
 * section happened to be mounted.
 */
function Walk() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!STATE.locked) return;
      const k = KEY_MAP[e.code];
      if (k) {
        KEYS[k] = true;
        e.preventDefault();
      }
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        KEYS.sprint = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = KEY_MAP[e.code];
      if (k) KEYS[k] = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        KEYS.sprint = false;
      }
    };
    /* Releases everything if the tab loses focus mid-stride, otherwise you
       come back still walking into the sea. */
    const blur = () => {
      KEYS.f = KEYS.b = KEYS.l = KEYS.r = KEYS.sprint = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      blur();
    };
  }, []);

  useFrame((_, rawDelta) => {
    const c = CONTROLS.current;
    if (!c) return;

    /* Clamp: a tab that has been backgrounded returns one enormous delta, and
       an unclamped step teleports you across the map. */
    const delta = Math.min(rawDelta, 0.05);

    const { input, velocity } = SCRATCH;
    input.set(
      (KEYS.r ? 1 : 0) - (KEYS.l ? 1 : 0),
      0,
      (KEYS.f ? 1 : 0) - (KEYS.b ? 1 : 0),
    );
    /* Normalised so diagonals are not 1.41x faster. */
    if (input.lengthSq() > 0) input.normalize();

    const speed = WALK_SPEED * (KEYS.sprint ? SPRINT_MULTIPLIER : 1);
    const target = STATE.locked ? speed : 0;

    velocity.x = MathUtils.damp(velocity.x, input.x * target, MOVE_DAMPING, delta);
    velocity.z = MathUtils.damp(velocity.z, input.z * target, MOVE_DAMPING, delta);

    if (Math.abs(velocity.z) > 1e-3) c.moveForward(velocity.z * delta);
    if (Math.abs(velocity.x) > 1e-3) c.moveRight(velocity.x * delta);

    /* Glue to the terrain. moveForward/moveRight are horizontal-only by
       construction, so y is ours to own. Damped so cresting a dune is a rise
       rather than a step. */
    const p = c.camera.position;
    const ground = duneHeight(p.x, p.z) + EYE_HEIGHT;
    p.y = MathUtils.damp(p.y, ground, 14, delta);

    /* Fence: stop at the waterline and inside the terrain plane. */
    if (p.x < 0.6) p.x = 0.6;
    if (p.x > DESERT_SPAN - 20) p.x = DESERT_SPAN - 20;
    const zLimit = DESERT_SPAN / 2 - 20;
    p.z = MathUtils.clamp(p.z, -zLimit, zLimit);
  });

  return null;
}

/* ===========================================================================
 * DAY / NIGHT CLOCK
 * ======================================================================== */

/**
 * Automated cycle. A triangle wave through a smoothstep, so the scene HOLDS
 * at full day and full night instead of sliding through both continuously —
 * a linear ramp never lets either state read.
 */
function Clock() {
  /* The fog and background objects are declared HERE, in the same component
     that animates them, and attached declaratively. Two reasons: `scene` from
     useThree() is a hook return value and writing to it is forbidden, and a
     ref created elsewhere and passed in would be a prop, which is forbidden
     too. Own the ref where you mutate it. */
  const fog = useRef<FogExp2>(null);
  const background = useRef<Color>(null);

  useFrame((state) => {
    const t = (state.clock.elapsedTime % CYCLE_SECONDS) / CYCLE_SECONDS;
    const triangle = t < 0.5 ? t * 2 : (1 - t) * 2;
    STATE.phase = smoothstep(0.28, 0.72, triangle);

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
      <fogExp2 ref={fog} attach="fog" args={[DAY.fog, DAY.fogDensity]} />
      <color ref={background} attach="background" args={[DAY.fog]} />
    </>
  );
}

/* ===========================================================================
 * LIGHTING
 * ======================================================================== */

function SceneLights() {
  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const magenta = useRef<PointLight>(null);
  const cyan = useRef<PointLight>(null);
  const violet = useRef<PointLight>(null);

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

    /* The fantasy lights are night-only, and they come up on a curve so they
       do not pop the instant the phase crosses a threshold. */
    const glow = t * t;
    if (magenta.current) magenta.current.intensity = glow * 26;
    if (cyan.current) cyan.current.intensity = glow * 22;
    if (violet.current) violet.current.intensity = glow * 18;
  });

  return (
    <>
      <ambientLight ref={ambient} />
      <directionalLight
        ref={key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0006}
      />

      {/* ---------- BIOLUMINESCENCE ----------
          Low, close to the trees, and coloured rather than white. Distance is
          deliberately short so they pool on the sand instead of washing the
          whole dune field flat. */}
      <pointLight
        ref={magenta}
        position={[TREE_POS[0] - 2, TREE_POS[1] + 2.2, TREE_POS[2] + 1.5]}
        color={GLOW_MAGENTA}
        distance={22}
        decay={2}
      />
      <pointLight
        ref={cyan}
        position={[TREE_POS[0] + 3.5, TREE_POS[1] + 1.4, TREE_POS[2] - 3]}
        color={GLOW_CYAN}
        distance={20}
        decay={2}
      />
      <pointLight
        ref={violet}
        position={[EXTRA_TREES[0].x, TREE_POS[1] + 3, EXTRA_TREES[0].z]}
        color={GLOW_VIOLET}
        distance={26}
        decay={2}
      />
    </>
  );
}

/* ===========================================================================
 * KITES — high in the sky, drifting
 * ======================================================================== */

function Kites() {
  const { object, scale, offset } = useGrounded(ASSETS.kites, KITE_H);
  const group = useRef<Group>(null);

  const kites = useMemo(() => {
    const r = rng(0x1e5c);
    return Array.from({ length: KITE_COUNT }, (_, i) => ({
      node: object.clone(true),
      phase: i / KITE_COUNT,
      radius: 6 + r() * 10,
      lift: r() * 6,
      speed: 0.1 + r() * 0.12,
      spin: 0.3 + r() * 0.5,
    }));
  }, [object]);

  useFrame((state) => {
    const node = group.current;
    if (!node) return;
    const t = state.clock.elapsedTime;

    node.children.forEach((child, i) => {
      const k = kites[i];
      if (!k) return;
      /* Wide, slow circles rather than a straight exit — they have to stay in
         the sky to be "clearly visible", which a fly-away does not do. */
      const a = t * k.speed + k.phase * Math.PI * 2;
      child.position.set(
        KITE_BASE.x + Math.cos(a) * k.radius,
        KITE_BASE.y + k.lift + Math.sin(t * 0.5 + i) * 1.2,
        KITE_BASE.z + Math.sin(a) * k.radius * 0.7,
      );
      child.rotation.set(
        Math.sin(t * k.spin + i) * 0.3,
        -a + Math.PI / 2,
        Math.sin(t * k.spin * 1.3 + i) * 0.4,
      );
      child.scale.setScalar(scale);
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

const MOTE_COUNT = 110;

function Motes() {
  const mesh = useRef<InstancedMesh>(null);

  const seeds = useMemo(() => {
    const r = rng(0x5eed);
    const anchors = [
      { x: TREE_POS[0], z: TREE_POS[2] },
      ...EXTRA_TREES.map((t) => ({ x: t.x, z: t.z })),
    ];
    return Array.from({ length: MOTE_COUNT }, () => {
      const anchor = anchors[Math.floor(r() * anchors.length)];
      return {
        origin: new Vector3(
          anchor.x + (r() - 0.5) * 9,
          /* Off the SAND, not off y=0. */
          duneHeight(anchor.x, anchor.z) + 0.4 + r() * TREE_H * 0.75,
          anchor.z + (r() - 0.5) * 9,
        ),
        radius: 0.4 + r() * 1.8,
        speed: 0.25 + r() * 0.7,
        drift: r() * Math.PI * 2,
        bob: 0.25 + r() * 0.8,
      };
    });
  }, []);

  useFrame((state) => {
    const node = mesh.current;
    if (!node) return;

    const t = state.clock.elapsedTime;
    const p = STATE.phase;
    const { dummy, colour, moteDay, moteNight } = SCRATCH;

    seeds.forEach((s, i) => {
      const a = s.drift + t * s.speed;
      dummy.position.set(
        s.origin.x + Math.cos(a) * s.radius,
        /* Butterflies flit, fireflies drift. Blending the two frequencies by
           phase morphs one into the other rather than swapping them. */
        s.origin.y +
          Math.sin(t * (2.4 - p * 1.9) + s.drift) * s.bob * (1 - p * 0.4),
        s.origin.z + Math.sin(a * 1.3) * s.radius,
      );
      dummy.scale.setScalar(MathUtils.lerp(0.045, 0.06, p));
      dummy.rotation.set(0, a, Math.sin(t * 6 + i) * 0.6 * (1 - p));
      dummy.updateMatrix();
      node.setMatrixAt(i, dummy.matrix);
    });

    node.instanceMatrix.needsUpdate = true;
    colour.copy(moteDay).lerp(moteNight, p);
    (node.material as { color?: Color }).color?.copy(colour);
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
  const [isNight, setIsNight] = useState(false);

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
          sunPosition={[SUN_POS.x / 12, SUN_POS.y / 12, SUN_POS.z / 12]}
          turbidity={3.2}
          rayleigh={3.4}
          mieCoefficient={0.004}
          mieDirectionalG={0.86}
        />
      )}

      {isNight && (
        <Stars
          radius={260}
          depth={90}
          count={7000}
          factor={5}
          saturation={0.4}
          fade
          speed={0.4}
        />
      )}
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

/* ===========================================================================
 * SCENE
 * ======================================================================== */

function Scene() {
  return (
    <>
      <Clock />
      <SceneLights />
      <SkyLayer />

      <Desert />
      <Sea />

      {/* ---------- BACK CENTRE: THE MOUNTAIN ---------- */}
      <Prop
        label="desert mountain"
        url={ASSETS.mountain}
        targetHeight={MOUNTAIN_H}
        position={MOUNTAIN_POS}
        rotationY={0.5}
      />

      {/* ---------- FOREGROUND: TREE + FIGURE ---------- */}
      <Prop
        label="dry tree (hero)"
        url={ASSETS.tree}
        targetHeight={TREE_H}
        position={TREE_POS}
        rotationY={0.4}
      />
      <Prop
        label="figure"
        url={ASSETS.figure}
        targetHeight={FIGURE_H}
        position={FIGURE_POS}
        rotationY={-0.7}
      />

      {EXTRA_TREES.map((t, i) => (
        <Prop
          key={i}
          label={`dry tree ${i + 2}`}
          url={ASSETS.tree}
          targetHeight={TREE_H * t.h}
          position={onSand(t.x, t.z, t.sink)}
          rotationY={t.rot}
        />
      ))}

      {/* ---------- SKY: SUN AND MOON ----------
          Both mounted and toggled by `visible`. The cycle is automatic, so
          both WILL be needed within a minute — mounting on demand would just
          stall the transition on a cold fetch. */}
      <Prop
        label="sun"
        url={ASSETS.sun}
        targetHeight={SUN_H}
        position={[SUN_POS.x, SUN_POS.y, SUN_POS.z]}
        visible={STATE.phase < 0.5}
      />
      <Prop
        label="moon"
        url={ASSETS.moon}
        targetHeight={MOON_H}
        position={[MOON_POS.x, MOON_POS.y, MOON_POS.z]}
        visible={STATE.phase >= 0.5}
      />

      {/* ---------- CLOUDS, BELOW THE SUN AND MOON ---------- */}
      {CLOUDS.map((c, i) => (
        <Float
          key={i}
          speed={c.speed}
          rotationIntensity={0.04}
          floatIntensity={1.4}
          floatingRange={[-1.2, 1.2]}
        >
          <Prop
            label={`cloud ${i + 1}`}
            url={ASSETS.cloud}
            targetHeight={CLOUD_H * c.h}
            position={c.pos}
          />
        </Float>
      ))}

      {/* ---------- KITES ---------- */}
      <AssetBoundary label="kites">
        <Suspense fallback={null}>
          <Kites />
        </Suspense>
      </AssetBoundary>

      <Motes />

      {/* Bioluminescent haze around the trees. Sparkles is procedural — no
          texture fetch, unlike drei's volumetric <Cloud>. */}
      <Sparkles
        count={90}
        scale={[26, 8, 26]}
        position={[TREE_POS[0], TREE_POS[1] + 3.5, TREE_POS[2] - 4]}
        size={3}
        speed={0.35}
        opacity={0.75}
        color="#8be9ff"
      />

      <Walk />
      <AdaptiveDpr pixelated />
    </>
  );
}

/* ===========================================================================
 * POINTER LOCK
 *
 * Lives inside the Canvas because drei's PointerLockControls has to. The
 * callback ref publishes the instance to the module holder so the button
 * outside the Canvas can call lock(), and onLock/onUnlock report back up
 * through a callback prop — calling a prop is fine, mutating one is not.
 * ======================================================================== */

function FirstPerson({ onLockChange }: { onLockChange: (v: boolean) => void }) {
  return (
    <PointerLockControls
      ref={(instance) => {
        CONTROLS.current = instance as unknown as FirstPersonControls | null;
      }}
      /* No `selector`: locking is driven by the button, so a stray click on
         the canvas never grabs the cursor. */
      onLock={() => {
        STATE.locked = true;
        onLockChange(true);
      }}
      onUnlock={() => {
        STATE.locked = false;
        KEYS.f = KEYS.b = KEYS.l = KEYS.r = KEYS.sprint = false;
        onLockChange(false);
      }}
    />
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
        className="flex h-full w-full items-center justify-center bg-[#0d0725] font-sans text-[0.6rem] tracking-[0.28em] text-white/40 uppercase"
        role="img"
        aria-label="A desert coastline at dusk — the interactive scene could not be loaded"
      >
        The coast is not available right now
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
  const [locked, setLocked] = useState(false);

  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <SceneBoundary>
        <Canvas
          dpr={[1, 1.75]}
          shadows
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          /* Eye height, and aimed at the mountain so the first frame is the
             composition even before anyone moves. `near` is 0.1 because you
             can now walk right up to the tree. */
          camera={{
            position: [
              START_XZ[0],
              duneHeight(START_XZ[0], START_XZ[1]) + EYE_HEIGHT,
              START_XZ[1],
            ],
            fov: 62,
            near: 0.1,
            far: 1200,
          }}
          onCreated={({ camera }) => camera.lookAt(LOOK_AT)}
        >
          <Suspense fallback={<SceneLoader />}>
            <Scene />
          </Suspense>

          <FirstPerson onLockChange={setLocked} />
        </Canvas>
      </SceneBoundary>

      {/* ---------- POEM ----------
          pointer-events-none throughout: this sits on top of the canvas, and
          anything clickable here would eat the click that starts the walk. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-16 transition-opacity duration-700 sm:pb-20 ${
          locked ? "opacity-25" : "opacity-100"
        }`}
      >
        <blockquote className="max-w-[34rem] text-center">
          <p
            className="font-display text-[clamp(0.95rem,2.1vw,1.35rem)] leading-[1.85] font-normal tracking-[0.01em] text-balance italic"
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

      {/* ---------- ENTER / EXIT ----------
          The only interactive thing on the overlay. Hidden while locked so it
          cannot sit under the crosshair. */}
      {!locked && (
        <button
          type="button"
          onClick={() => CONTROLS.current?.lock()}
          className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/45 px-7 py-3 font-sans text-[0.6rem] tracking-[0.3em] text-white/90 uppercase backdrop-blur-sm transition hover:border-white/60 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
        >
          Click to walk · W A S D · Esc to leave
        </button>
      )}

      {/* Crosshair, only while walking. */}
      {locked && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
        >
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/50" />
          <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-white/50" />
        </div>
      )}
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
