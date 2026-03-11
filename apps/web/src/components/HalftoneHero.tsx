"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";
import { usePointerUniform } from "@/hooks/usePointerUniform";
import { createHalftoneColorNode } from "@/lib/shaders/halftoneColorNode";
import WebGPUSketch from "./webgpu/WebGPUSketch";

const WebGPUScene = dynamic(() => import("./webgpu/WebGPUScene"), {
  ssr: false,
});

function HalftoneSketch() {
  const texture = useLoader(THREE.TextureLoader, "/textures/bg-texture.webp");
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const pointerUniform = usePointerUniform();
  const hoveredRef = useRef(false);
  const trailHeadRef = useRef(0);
  const trailCooldownRef = useRef(0);
  const lastTrailPointRef = useRef(new THREE.Vector2(Number.NaN, Number.NaN));

  const { colorNode, uniforms } = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
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
    uniforms.contrast.value = 1.55;
    uniforms.invertLuma.value = 1.0;
    uniforms.noiseSpeed.value = 0.55;
    uniforms.noiseScale.value = 5.7;
    uniforms.noiseAmount.value = 0.29;
    uniforms.pointerRadius.value = 0.8;
    uniforms.pointerBoost.value = 0.52;
    uniforms.trailRadius.value = 0.56;
    uniforms.trailBoost.value = 0.7;

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

  useFrame((_, delta) => {
    const pointer = pointerUniform.value as THREE.Vector2;
    (uniforms.pointer.value as THREE.Vector2).copy(pointer);

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
      lastPoint.distanceToSquared(pointer) > 0.0025;
    if (!movedEnough) {
      return;
    }

    const idx = trailHeadRef.current % uniforms.trailPoints.length;
    (uniforms.trailPoints[idx].value as THREE.Vector2).copy(pointer);
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
    <div className="z-10 absolute inset-0 w-full h-full">
      <WebGPUScene frameloop="always" orthographic>
        <HalftoneSketch />
      </WebGPUScene>
    </div>
  );
}
