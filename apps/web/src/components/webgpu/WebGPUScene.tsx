"use client";

import { OrthographicCamera } from "@react-three/drei";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useState } from "react";
import { WebGPURenderer } from "three/webgpu";
import { ColorSpaceCorrection } from "./ColorSpaceCorrection";

type SceneProps = {
  debug?: boolean;
  frameloop?: "always" | "demand" | "never";
  orthographic?: boolean;
} & Omit<CanvasProps, "gl" | "frameloop">;

export default function WebGPUScene({
  frameloop = "always",
  orthographic = true,
  children,
  ...props
}: SceneProps) {
  const [rendererReady, setRendererReady] = useState(false);

  // Start rendering as soon as WebGPU is initialized.
  const activeFrameloop = rendererReady ? frameloop : "never";

  return (
    <Canvas
      {...props}
      dpr={
        typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio, 1.5)
          : 1
      }
      frameloop={activeFrameloop}
      gl={async (rendererProps) => {
        const renderer = new WebGPURenderer({
          ...(rendererProps as ConstructorParameters<typeof WebGPURenderer>[0]),
          powerPreference: "high-performance",
        });
        await renderer.init();
        setRendererReady(true);
        return renderer;
      }}
    >
      {rendererReady ? children : null}
      {rendererReady ? <ColorSpaceCorrection /> : null}
      {orthographic ? (
        <OrthographicCamera makeDefault position={[0, 0, 1]} />
      ) : null}
    </Canvas>
  );
}
