"use client";

import { OrthographicCamera, Preload } from "@react-three/drei";
import { Canvas, type CanvasProps, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { WebGPURenderer } from "three/webgpu";
import { ColorSpaceCorrection } from "./ColorSpaceCorrection";

type SceneProps = {
  debug?: boolean;
  frameloop?: "always" | "demand" | "never";
  orthographic?: boolean;
} & Omit<CanvasProps, "gl" | "frameloop">;

/**
 * Compiles the scene's WebGPU pipelines before starting the render loop.
 * Without this, Three.js tries to draw before shaders are compiled.
 */
function CompileGuard({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    gl.compileAsync(scene, camera).then(onReady);
  }, [gl, scene, camera, onReady]);

  return null;
}

export default function WebGPUScene({
  frameloop = "always",
  orthographic = true,
  children,
  ...props
}: SceneProps) {
  const [rendererReady, setRendererReady] = useState(false);
  const [compiled, setCompiled] = useState(false);

  // Only start the frameloop after both renderer init AND pipeline compilation
  const activeFrameloop = rendererReady && compiled ? frameloop : "never";

  const onCompiled = useCallback(() => setCompiled(true), []);

  return (
    <Canvas
      {...props}
      dpr={typeof window !== "undefined" ? window.devicePixelRatio : 1}
      frameloop={activeFrameloop}
      gl={async (rendererProps) => {
        const renderer = new WebGPURenderer(
          rendererProps as ConstructorParameters<typeof WebGPURenderer>[0],
        );
        await renderer.init();
        setRendererReady(true);
        return renderer;
      }}
    >
      <Preload all />
      {children}
      <ColorSpaceCorrection />
      <CompileGuard onReady={onCompiled} />
      {orthographic ? (
        <OrthographicCamera makeDefault position={[0, 0, 1]} />
      ) : null}
    </Canvas>
  );
}
