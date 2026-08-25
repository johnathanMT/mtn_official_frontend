"use client";

/**
 * Matrix-style computer-science code rain, parked behind the hero figures.
 *
 * One canvas texture on a plane at negative Z — never between the camera and
 * the GLBs. Real glyphs (not a noise shader) so it reads as code: binary,
 * hex, braces, katakana.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  LinearFilter,
  NearestFilter,
  SRGBColorSpace,
} from "three";

const FIELD = "#0B3B4C";
/** Bright leading glyph — antique ivory so the head still reads on navy. */
const HEAD = "#F4E4B8";
/** Old gold — the site's metal, not Matrix green. */
const TRAIL = "#CFB53B";
const ANTIQUE = "#A68B2C";

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEF<>/{}[]|=+*&;:#λΣπ01";

const COLS = 64;
const ROWS = 40;
const CELL = 24;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;

function pickGlyph() {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0] ?? "0";
}

function makeRain() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = NearestFilter;

  const drops = new Float32Array(COLS);
  const speeds = new Float32Array(COLS);
  const antique = new Uint8Array(COLS);
  for (let i = 0; i < COLS; i += 1) {
    drops[i] = Math.random() * ROWS;
    speeds[i] = 0.35 + Math.random() * 0.85;
    antique[i] = Math.random() > 0.82 ? 1 : 0;
  }

  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.font = `${CELL - 4}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  texture.needsUpdate = true;

  return { canvas, ctx, texture, drops, speeds, antique };
}

function paintStatic(rain: NonNullable<ReturnType<typeof makeRain>>) {
  const { ctx, drops } = rain;
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < COLS; i += 1) {
    const x = i * CELL + CELL / 2;
    const head = drops[i] ?? 0;
    for (let row = 0; row < 14; row += 1) {
      const y = ((head - row + ROWS) % ROWS) * CELL;
      const alpha = Math.max(0.08, 1 - row / 14);
      ctx.fillStyle =
        row === 0
          ? HEAD
          : rain.antique[i]
            ? `rgba(166, 139, 44, ${alpha})`
            : `rgba(207, 181, 59, ${alpha})`;
      ctx.fillText(pickGlyph(), x, y);
    }
  }
  rain.texture.needsUpdate = true;
}

function paintFrame(rain: NonNullable<ReturnType<typeof makeRain>>) {
  const { ctx, drops, speeds } = rain;
  ctx.fillStyle = "rgba(11, 59, 76, 0.14)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < COLS; i += 1) {
    const x = i * CELL + CELL / 2;
    const row = drops[i] ?? 0;
    const y = (row | 0) * CELL;
    ctx.fillStyle = HEAD;
    ctx.fillText(pickGlyph(), x, y);
    ctx.fillStyle = rain.antique[i] ? ANTIQUE : TRAIL;
    ctx.fillText(pickGlyph(), x, y - CELL);

    drops[i] = row + (speeds[i] ?? 0.5);
    if ((drops[i] ?? 0) > ROWS + 2 && Math.random() > 0.96) {
      drops[i] = -Math.random() * 16;
    }
  }

  rain.texture.needsUpdate = true;
}

function MatrixRain({ reducedMotion }: { reducedMotion: boolean }) {
  const rain = useMemo(() => makeRain(), []);
  const acc = useRef(0);
  const seeded = useRef(false); // first frame paints a full curtain, then rain falls

  useEffect(() => {
    return () => {
      rain?.texture.dispose();
    };
  }, [rain]);

  useFrame((_, delta) => {
    if (!rain) return;
    try {
      if (!seeded.current) {
        paintStatic(rain);
        seeded.current = true;
        if (reducedMotion) return;
      }
      if (reducedMotion) return;
      acc.current += delta;
      if (acc.current < 1 / 26) return;
      acc.current = 0;
      paintFrame(rain);
    } catch (error) {
      console.error("[HeroMatrix] rain paint failed:", error);
    }
  });

  if (!rain) return null;

  return (
    <mesh position={[0, 0.4, -12]} renderOrder={-10}>
      <planeGeometry args={[42, 26]} />
      <meshBasicMaterial
        map={rain.texture}
        toneMapped={false}
        depthWrite={false}
        depthTest
      />
    </mesh>
  );
}

export function HeroMatrix({ reducedMotion }: { reducedMotion: boolean }) {
  return <MatrixRain reducedMotion={reducedMotion} />;
}
