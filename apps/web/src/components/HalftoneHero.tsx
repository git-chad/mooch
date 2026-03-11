"use client";

import { useEffect, useMemo } from "react";
import { useControls } from "leva";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import dynamic from "next/dynamic";
import WebGPUSketch from "./webgpu/WebGPUSketch";
import { createHalftoneColorNode } from "@/lib/shaders/halftoneColorNode";

const WebGPUScene = dynamic(() => import("./webgpu/WebGPUScene"), {
  ssr: false,
});

function HalftoneSketch() {
  const texture = useLoader(THREE.TextureLoader, "/textures/bg-texture.webp");
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

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

  useControls("Grid", {
    pixelSize: {
      value: 20,
      min: 4,
      max: 80,
      step: 1,
      onChange: (v: number) => {
        uniforms.pixelSize.value = v;
      },
    },
    dotRadius: {
      value: 1.15,
      min: 0.1,
      max: 2.0,
      step: 0.01,
      onChange: (v: number) => {
        uniforms.dotRadius.value = v;
      },
    },
    angle: {
      value: 45,
      min: 0,
      max: 360,
      step: 1,
      onChange: (v: number) => {
        uniforms.angle.value = (v * Math.PI) / 180;
      },
    },
  });

  useControls("Tone", {
    contrast: {
      value: 1.55,
      min: 0,
      max: 3,
      step: 0.05,
      onChange: (v: number) => {
        uniforms.contrast.value = v;
      },
    },
    invertLuma: {
      value: true,
      onChange: (v: boolean) => {
        uniforms.invertLuma.value = v ? 1.0 : 0.0;
      },
    },
  });

  useControls("Color", {
    bgColor: {
      value: "#FCFCFB",
      onChange: (v: string) => {
        const col = new THREE.Color(v);
        (uniforms.bgColor.value as THREE.Vector3).set(col.r, col.g, col.b);
      },
    },
  });

  return <WebGPUSketch colorNode={colorNode} />;
}

export default function HalftoneHero() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <WebGPUScene frameloop="always" orthographic>
        <HalftoneSketch />
      </WebGPUScene>
    </div>
  );
}
