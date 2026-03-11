"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { NoToneMapping, SRGBColorSpace } from "three/webgpu";

export const ColorSpaceCorrection = () => {
  const { set } = useThree((state) => state);

  useEffect(() => {
    set((state) => {
      const _state = { ...state };
      _state.gl.outputColorSpace = SRGBColorSpace;
      _state.gl.toneMapping = NoToneMapping;
      return _state;
    });
  }, [set]);

  return null;
};
