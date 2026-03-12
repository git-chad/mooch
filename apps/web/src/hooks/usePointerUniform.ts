"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { uniform } from "three/tsl";
import * as THREE from "three/webgpu";

/**
 * Mirrors the current pointer position into a TSL uniform in [-1, 1] NDC space.
 * Reads from R3F's pointer state each frame.
 */
export function usePointerUniform(initial?: { x: number; y: number }) {
  const pointerUniform = useMemo(() => uniform(new THREE.Vector2(0, 0)), []);

  useEffect(() => {
    (pointerUniform.value as THREE.Vector2).set(
      initial?.x ?? 0,
      initial?.y ?? 0,
    );
  }, [initial?.x, initial?.y, pointerUniform]);

  useFrame(({ pointer }) => {
    (pointerUniform.value as THREE.Vector2).set(pointer.x, pointer.y);
  });

  return pointerUniform;
}
