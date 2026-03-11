"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { NoToneMapping, SRGBColorSpace } from "three/webgpu";

export const ColorSpaceCorrection = () => {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = NoToneMapping;
  }, [gl]);

  return null;
};
