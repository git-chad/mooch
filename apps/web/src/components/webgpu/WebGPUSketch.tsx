"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { sin, time, uv, vec3 } from "three/tsl";

type WebGPUSketchProps = {
  colorNode?: unknown;
};

export default function WebGPUSketch({ colorNode }: WebGPUSketchProps) {
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
    <mesh material={material} scale={[width, height, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
