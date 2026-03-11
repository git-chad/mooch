"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";
import { createHalftoneColorNode } from "@/lib/shaders/halftoneColorNode";
import WebGPUScene from "./webgpu/WebGPUScene";
import WebGPUSketch from "./webgpu/WebGPUSketch";

const BG_TEXTURE_URL = "/textures/bg-texture.webp";
const INTRO_CONTRAST_FROM = 3.0;
const INTRO_CONTRAST_TO = 1.55;
useLoader.preload(THREE.TextureLoader, BG_TEXTURE_URL);

function HalftoneSketch() {
  const texture = useLoader(THREE.TextureLoader, BG_TEXTURE_URL);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const hoveredRef = useRef(false);
  const trailHeadRef = useRef(0);
  const trailCooldownRef = useRef(0);
  const lastTrailPointRef = useRef(new THREE.Vector2(Number.NaN, Number.NaN));
  const readyEventSentRef = useRef(false);

  const { colorNode, uniforms } = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return createHalftoneColorNode(texture);
  }, [texture]);

  // Keep resolution uniform in sync with actual canvas size
  useEffect(() => {
    const dpr = gl.getPixelRatio();
    (uniforms.resolution.value as THREE.Vector2).set(
      size.width * dpr,
      size.height * dpr,
    );
  }, [gl, size, uniforms]);

  useEffect(() => {
    uniforms.pixelSize.value = 20;
    uniforms.dotRadius.value = 1.15;
    uniforms.angle.value = (45 * Math.PI) / 180;
    uniforms.contrast.value = INTRO_CONTRAST_FROM;
    uniforms.invertLuma.value = 1.0;
    uniforms.noiseSpeed.value = 0.55;
    uniforms.noiseScale.value = 5.7;
    uniforms.noiseAmount.value = 0.29;
    uniforms.pointerRadius.value = 0.8;
    uniforms.pointerBoost.value = 0.52;
    uniforms.trailRadius.value = 0.56;
    uniforms.trailBoost.value = 0.7;
    uniforms.introProgress.value = 0.0;

    const col = new THREE.Color("#FCFCFB");
    (uniforms.bgColor.value as THREE.Vector3).set(col.r, col.g, col.b);
  }, [uniforms]);

  useEffect(() => {
    const canvas = gl.domElement as HTMLCanvasElement | undefined;
    if (!canvas) {
      return;
    }

    const onEnter = () => {
      hoveredRef.current = true;
    };
    const onLeave = () => {
      hoveredRef.current = false;
      lastTrailPointRef.current.set(Number.NaN, Number.NaN);
    };

    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    return () => {
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
    };
  }, [gl]);

  useFrame(({ pointer }, delta) => {
    if (!readyEventSentRef.current) {
      readyEventSentRef.current = true;
      (
        window as Window & {
          __halftoneReady?: boolean;
        }
      ).__halftoneReady = true;
      window.dispatchEvent(new Event("halftone:ready"));
    }

    (uniforms.pointer.value as THREE.Vector2).set(pointer.x, pointer.y);
    const introRaw = uniforms.introProgress.value;
    const introNow = typeof introRaw === "number" ? introRaw : 0;
    const nextIntro = THREE.MathUtils.damp(introNow, 1.0, 1.55, delta);
    uniforms.introProgress.value = nextIntro > 0.999 ? 1.0 : nextIntro;

    const contrastRaw = uniforms.contrast.value;
    const contrastNow =
      typeof contrastRaw === "number" ? contrastRaw : INTRO_CONTRAST_FROM;
    const contrastMix = THREE.MathUtils.smoothstep(nextIntro, 0.08, 0.96);
    const contrastTarget = THREE.MathUtils.lerp(
      INTRO_CONTRAST_FROM,
      INTRO_CONTRAST_TO,
      contrastMix,
    );
    uniforms.contrast.value =
      nextIntro >= 0.999
        ? INTRO_CONTRAST_TO
        : THREE.MathUtils.damp(contrastNow, contrastTarget, 2.9, delta);

    const currentHover = uniforms.hoverMix.value as number;
    const targetHover = hoveredRef.current ? 1 : 0;
    uniforms.hoverMix.value = THREE.MathUtils.damp(
      currentHover,
      targetHover,
      10,
      delta,
    );

    for (let i = 0; i < uniforms.trailLives.length; i++) {
      uniforms.trailLives[i].value = Math.max(
        0,
        (uniforms.trailLives[i].value as number) - delta * 2.35,
      );
    }

    trailCooldownRef.current -= delta;
    if (!hoveredRef.current || trailCooldownRef.current > 0) {
      return;
    }

    const lastPoint = lastTrailPointRef.current;
    const movedEnough =
      Number.isNaN(lastPoint.x) ||
      (pointer.x - lastPoint.x) * (pointer.x - lastPoint.x) +
        (pointer.y - lastPoint.y) * (pointer.y - lastPoint.y) >
        0.0025;
    if (!movedEnough) {
      return;
    }

    const idx = trailHeadRef.current % uniforms.trailPoints.length;
    (uniforms.trailPoints[idx].value as THREE.Vector2).set(
      pointer.x,
      pointer.y,
    );
    uniforms.trailLives[idx].value = 1.0;
    trailHeadRef.current =
      (trailHeadRef.current + 1) % uniforms.trailPoints.length;
    lastPoint.copy(pointer);
    trailCooldownRef.current = 1 / 48;
  });

  return (
    <WebGPUSketch
      colorNode={colorNode}
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        lastTrailPointRef.current.set(Number.NaN, Number.NaN);
      }}
    />
  );
}

export default function HalftoneHero() {
  return (
    <div className="z-10 absolute inset-0 w-full h-full bg-[#FCFCFB]">
      <WebGPUScene frameloop="always" orthographic>
        <HalftoneSketch />
      </WebGPUScene>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-[#FCFCFB]" />
    </div>
  );
}
