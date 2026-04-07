# Homepage Implementation Plan (`mooched.app`)

Based on the "Homepage - Final Version" design in Paper (node `2PI-0`).

## Sections

### Hero

- [ ] Full-width hero background (blue halftone dots pattern + gradient fade to white)
- [ ] "Coming pretty soon" pill badge (top center)
- [ ] Main heading — "mooch or get mooched" (large display type, Geist)
- [ ] Subheading — "mooch's your everyday tool for micro-managing your friends..."
- [ ] CTA button group — "Log in" (ghost) + "Sign up for free" (primary green)

### Features

- [ ] Section header — "All the tools you need in one place." + subtitle
- [ ] **Expense Tracking** featured card (large, image placeholder + green "Expense Tracking" badge + caption)
- [ ] **Polls** featured card (large, image placeholder + green "Polls" badge + caption)
- [ ] "There's more." divider/subheading
- [ ] 2x2 grid of smaller feature cards:
  - [ ] Plans card (image + badge + description)
  - [ ] Events card (image + badge + description)
  - [ ] Insights card (image + badge + description)
  - [ ] Feed card (image + badge + description)

### CTA / Waitlist

- [ ] Waitlist heading — "If you're interested, sign up to our waiting list..."
- [ ] Email input + "Sign up to Waitlist" button
- [ ] Black-and-white dot-art character illustrations

### Footer

- [ ] "mooched.app" logo/text with green blob accent
- [ ] Footer links — Features, FAQ, Pricing, Back to top

---

## Halftone Hero Shader

WebGPU + TSL (Three.js Shading Language) halftone background rendered on a full-screen quad.

### Colors

- Background (light): `#EFF5FE`
- Dots (blue): `#0099DD`

### Architecture

The shader runs as a standalone `MeshBasicNodeMaterial` colorNode on a full-viewport plane — **not** as a post-processing pass. The existing `HalftonePass` (below) is reference for the algorithm; we'll extract the core halftone logic into a pure TSL colorNode.

### Reference Code

#### TSL Utilities

##### `sdSphere` — Circle SDF

```ts
import { Fn, float, length, vec2 } from "three/tsl";

export const sdSphere = Fn(([_uv, r = float(0.0)]) => {
  const _r = float(r);
  return length(_uv).sub(_r);
});
```

##### `screenAspectUV` — Aspect-corrected UVs

```ts
import { uv, float, select, vec2 } from "three/tsl";

export const screenAspectUV = (
  r: ReturnType<typeof vec2>,
  range = float(0.5),
) => {
  const _uv = uv().sub(range);
  const final = select(
    r.x.greaterThan(r.y),
    vec2(_uv.x.mul(r.x.div(r.y)), _uv.y),
    vec2(_uv.x, _uv.y.mul(r.y.div(r.x))),
  );
  return final;
};
```

##### `simplexNoise3d` — 3D Simplex Noise

```ts
import {
  vec4,
  mod,
  Fn,
  mul,
  sub,
  vec3,
  vec2,
  dot,
  floor,
  step,
  min,
  max,
  float,
  abs,
} from "three/tsl";
import { permute, taylorInvSqrt } from "./common";

export const simplexNoise3d = Fn(([v_immutable]) => {
  const v = vec3(v_immutable).toVar();
  const C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const D = vec4(0.0, 0.5, 1.0, 2.0);
  const i = vec3(floor(v.add(dot(v, C.yyy)))).toVar();
  const x0 = vec3(v.sub(i).add(dot(i, C.xxx))).toVar();
  const g = vec3(step(x0.yzx, x0.xyz)).toVar();
  const l = vec3(sub(1.0, g)).toVar();
  const i1 = vec3(min(g.xyz, l.zxy)).toVar();
  const i2 = vec3(max(g.xyz, l.zxy)).toVar();
  const x1 = vec3(x0.sub(i1).add(mul(1.0, C.xxx))).toVar();
  const x2 = vec3(x0.sub(i2).add(mul(2.0, C.xxx))).toVar();
  const x3 = vec3(x0.sub(1).add(mul(3.0, C.xxx))).toVar();
  i.assign(mod(i, 289.0));
  const p = vec4(
    permute(
      permute(
        permute(i.z.add(vec4(0.0, i1.z, i2.z, 1.0))).add(
          i.y.add(vec4(0.0, i1.y, i2.y, 1.0)),
        ),
      ).add(i.x.add(vec4(0.0, i1.x, i2.x, 1.0))),
    ),
  ).toVar();
  const n_ = float(1.0 / 7.0).toVar();
  const ns = vec3(n_.mul(D.wyz).sub(D.xzx)).toVar();
  const j = vec4(p.sub(mul(49.0, floor(p.mul(ns.z.mul(ns.z)))))).toVar();
  const x_ = vec4(floor(j.mul(ns.z))).toVar();
  const y_ = vec4(floor(j.sub(mul(7.0, x_)))).toVar();
  const x = vec4(x_.mul(ns.x).add(ns.yyyy)).toVar();
  const y = vec4(y_.mul(ns.x).add(ns.yyyy)).toVar();
  const h = vec4(sub(1.0, abs(x).sub(abs(y)))).toVar();
  const b0 = vec4(x.xy, y.xy).toVar();
  const b1 = vec4(x.zw, y.zw).toVar();
  const s0 = vec4(floor(b0).mul(2.0).add(1.0)).toVar();
  const s1 = vec4(floor(b1).mul(2.0).add(1.0)).toVar();
  const sh = vec4(step(h, vec4(0.0)).negate()).toVar();
  const a0 = vec4(b0.xzyw.add(s0.xzyw.mul(sh.xxyy))).toVar();
  const a1 = vec4(b1.xzyw.add(s1.xzyw.mul(sh.zzww))).toVar();
  const p0 = vec3(a0.xy, h.x).toVar();
  const p1 = vec3(a0.zw, h.y).toVar();
  const p2 = vec3(a1.xy, h.z).toVar();
  const p3 = vec3(a1.zw, h.w).toVar();
  const norm = vec4(
    taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))),
  ).toVar();
  p0.mulAssign(norm.x);
  p1.mulAssign(norm.y);
  p2.mulAssign(norm.z);
  p3.mulAssign(norm.w);
  const m = vec4(
    max(
      sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
      0.0,
    ),
  ).toVar();
  m.assign(m.mul(m));
  return mul(
    42.0,
    dot(m.mul(m), vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))),
  );
});
```

##### Common Math Helpers

```ts
import { Fn, mul, add, mod, sub } from "three/tsl";

export const permute = Fn(([x]) => {
  return mod(mul(add(mul(x, 34.0), 10.0), x), 289.0);
});

export const taylorInvSqrt = Fn(([r]) => {
  return sub(1.79284291400159, mul(0.85373472095314, r));
});

export const mod289 = Fn(([x]) => {
  return mod(mul(add(mul(x, 34.0), 10.0), x), 289.0);
});

export const fade = Fn(([t]) => {
  return mul(t, t).mul(t.mul(t.mul(t.mul(t.mul(6.0).sub(15.0).add(10.0)))));
});
```

##### Tonemapping Functions

```ts
import { Fn, float, vec3, pow, smoothstep, mix } from "three/tsl";

export const reinhardTonemap = Fn(([_color]) => {
  return _color.div(_color.add(1.0));
});

export const acesTonemap = Fn(([_color]) => {
  const a = 2.51,
    b = 0.03,
    c = 2.43,
    d = 0.59,
    e = 0.14;
  return _color
    .mul(a)
    .add(b)
    .div(_color.mul(c).add(_color.mul(d)).add(e))
    .clamp(0.0, 1.0);
});

export const cinematicTonemap = Fn(([_color]) => {
  const r = smoothstep(0.05, 0.95, _color.x.mul(0.95).add(0.02));
  const g = smoothstep(0.05, 0.95, _color.y.mul(1.05));
  const b = smoothstep(0.05, 0.95, _color.z.mul(1.1));
  return vec3(r, g, b).clamp(0.0, 1.0);
});
```

#### React Components

##### `WebGPUScene` — Canvas wrapper with WebGPU renderer

```tsx
"use client";

import {
  AdaptiveDpr,
  OrthographicCamera,
  Preload,
  StatsGl,
} from "@react-three/drei";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useState } from "react";
import { WebGPURenderer } from "three/webgpu";
import { ColorSpaceCorrection } from "@/components/webgpu/ColorSpaceCorrection";

type SceneProps = {
  debug?: boolean;
  frameloop?: "always" | "demand" | "never";
  orthographic?: boolean;
} & Omit<CanvasProps, "gl" | "frameloop">;

export default function WebGPUScene({
  debug = false,
  frameloop = "always",
  orthographic = true,
  children,
  ...props
}: SceneProps) {
  const [canvasFrameloop, setCanvasFrameloop] =
    useState<SceneProps["frameloop"]>("never");

  return (
    <Canvas
      id="__webgpucanvas"
      {...props}
      frameloop={canvasFrameloop}
      gl={async (rendererProps) => {
        const renderer = new WebGPURenderer(
          rendererProps as ConstructorParameters<typeof WebGPURenderer>[0],
        );
        await renderer.init();
        setCanvasFrameloop(frameloop);
        return renderer;
      }}
    >
      <Preload all />
      <AdaptiveDpr />
      {children}
      <ColorSpaceCorrection />
      {debug ? <StatsGl /> : null}
      {orthographic ? (
        <OrthographicCamera makeDefault position={[0, 0, 1]} />
      ) : null}
    </Canvas>
  );
}
```

##### `ColorSpaceCorrection` — Linear color space + no tonemapping

```tsx
"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { LinearSRGBColorSpace, NoToneMapping } from "three/webgpu";

export const ColorSpaceCorrection = () => {
  const { set } = useThree((state) => state);

  useEffect(() => {
    set((state) => {
      const _state = { ...state };
      _state.gl.outputColorSpace = LinearSRGBColorSpace;
      _state.gl.toneMapping = NoToneMapping;
      return _state;
    });
  }, [set]);

  return null;
};
```

##### `WebGPUSketch` — Full-viewport quad with custom colorNode

```tsx
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
```

#### `HalftonePass` — Full reference (post-processing pass)

This is the original halftone as a post-processing pass from Paper. We'll adapt the core algorithm (rotated grid, 3x3 neighbourhood, SDF dot coverage) into a standalone colorNode for the hero.

<details>
<summary>Full HalftonePass source</summary>

```ts
import * as THREE from "three/webgpu";
import {
  uv,
  vec2,
  vec3,
  vec4,
  float,
  uniform,
  floor,
  clamp,
  length,
  smoothstep,
  mix,
  select,
  screenSize,
  texture as tslTexture,
  sin,
  cos,
  abs,
  max,
  min,
} from "three/tsl";

export class HalftonePass extends PassNode {
  // Uniforms
  private readonly _gridSpacingU = uniform(20.0);
  private readonly _viewportScaleU = uniform(1.0);
  private readonly _dotSizeU = uniform(8.0);
  private readonly _dotMinU = uniform(2.0);
  private readonly _shapeU = uniform(0.0); // 0=circle 1=square 2=diamond 3=line
  private readonly _angleU = uniform((45 * Math.PI) / 180);
  private readonly _colorModeU = uniform(1.0); // 0=source 1=mono 2=duotone
  private readonly _contrastU = uniform(1.0);
  private readonly _softnessU = uniform(0.1);
  private readonly _invertU = uniform(0.0);
  private readonly _duotoneLightU = uniform(
    new THREE.Vector3(/* light color */),
  );
  private readonly _duotoneDarkU = uniform(new THREE.Vector3(/* dark color */));

  // Core algorithm in _buildEffectNode():
  // 1. Convert pixel coords to rotated grid space (angle uniform)
  // 2. Find current cell center via floor(rotated / gridSpacing + 0.5) * gridSpacing
  // 3. For each of the 3x3 neighbouring cells:
  //    a. Inverse-rotate cell center back to screen UV
  //    b. Sample input texture at that UV
  //    c. Compute luminance (Rec. 709)
  //    d. Derive dot radius from luminance * dotSize + dotMin
  //    e. Compute SDF distance (circle/square/diamond/line)
  //    f. smoothstep for anti-aliased coverage
  //    g. Max-fold: highest coverage cell wins
  // 4. Final color = mix(bgColor, dotColor, coverage)
  //    - duotone mode: mix(darkVec, lightVec, luma)
}
```

</details>

#### `HalftonePass` Parameters (values)

{
"id": "e7d8ee7d-be23-404a-9279-68ed858e408e",
"name": "Halftone",
"kind": "shader",
"shaderType": "halftone",
"filterMode": "filter",
"visible": true,
"solo": false,
"opacity": 1,
"blendMode": "normal",
"params": [
{
"key": "dotSize",
"label": "Dot Size",
"type": "float",
"value": 6,
"min": 0,
"max": 20,
"step": 0.5,
"group": "Grid",
"description": "Luma-driven radius added on top of the minimum (bright → larger)"
},
{
"key": "dotMin",
"label": "Min Radius",
"type": "float",
"value": 0,
"min": 0,
"max": 10,
"step": 0.5,
"group": "Grid",
"description": "Minimum dot radius in pixels (keeps dots visible in dark areas)"
},
{
"key": "gridSpacing",
"label": "Grid Spacing",
"type": "float",
"value": 6,
"min": 4,
"max": 80,
"step": 1,
"group": "Grid",
"description": "Distance between dot centers in screen pixels"
},
{
"key": "shape",
"label": "Shape",
"type": "enum",
"value": "circle",
"options": [
{
"label": "Circle",
"value": "circle"
},
{
"label": "Square",
"value": "square"
},
{
"label": "Diamond",
"value": "diamond"
},
{
"label": "Line",
"value": "line"
}
],
"group": "Grid"
},
{
"key": "angle",
"label": "Angle",
"type": "float",
"value": 45,
"min": 0,
"max": 360,
"step": 1,
"group": "Grid",
"description": "Rotation angle of the halftone grid (degrees)"
},
{
"key": "colorMode",
"label": "Color Mode",
"type": "enum",
"value": "source",
"options": [
{
"label": "Monochrome",
"value": "monochrome"
},
{
"label": "Source",
"value": "source"
},
{
"label": "Duotone",
"value": "duotone"
}
],
"group": "Color"
},
{
"key": "duotoneLight",
"label": "Light Color",
"type": "color",
"value": "#F5F5F0",
"group": "Color",
"description": "Light tone color (used in duotone mode)"
},
{
"key": "duotoneDark",
"label": "Dark Color",
"type": "color",
"value": "#1d1d1c",
"group": "Color",
"description": "Dark tone color (used in duotone mode)"
},
{
"key": "contrast",
"label": "Contrast",
"type": "float",
"value": 1.4,
"min": 0,
"max": 2,
"step": 0.05,
"group": "Tone"
},
{
"key": "softness",
"label": "Softness",
"type": "float",
"value": 0,
"min": 0,
"max": 1,
"step": 0.01,
"group": "Tone",
"description": "Anti-aliasing width at dot edges"
},
{
"key": "invertLuma",
"label": "Invert Luma",
"type": "bool",
"value": true,
"group": "Tone",
"description": "Invert luminance so dark areas produce large dots"
},
{
"key": "interactionInput",
"label": "Interaction",
"type": "enum",
"value": "none",
"options": [
{
"label": "None",
"value": "none"
},
{
"label": "Fluid trail",
"value": "trail"
},
{
"label": "Displacement",
"value": "displacement"
}
],
"group": "Interaction",
"description": "Use Interactivity layer textures to modulate dot size"
},
{
"key": "interactionAmount",
"label": "Amount",
"type": "float",
"value": 0,
"min": 0,
"max": 2,
"step": 0.01,
"group": "Interaction"
}
],
"locked": false,
"expanded": true,
"mediaVersion": 0
}
