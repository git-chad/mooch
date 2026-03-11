"use client";

import type { ThreeElements } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { sin, time, uv, vec3 } from "three/tsl";
import { MeshBasicNodeMaterial } from "three/webgpu";

type WebGPUSketchProps = ThreeElements["mesh"] & {
  colorNode?: unknown;
};

export default function WebGPUSketch({
  colorNode,
  ...meshProps
}: WebGPUSketchProps) {
  const material = useMemo(() => {
    const nodeMaterial = new MeshBasicNodeMaterial({ transparent: true });
    const uvNode = uv();
    nodeMaterial.colorNode = (colorNode as never) ?? vec3(uvNode, sin(time));
    return nodeMaterial;
  }, [colorNode]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const { width, height } = useThree((state) => state.viewport);

  return (
    <mesh material={material} scale={[width, height, 1]} {...meshProps}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
