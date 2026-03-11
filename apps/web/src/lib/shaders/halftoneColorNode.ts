import {
  uv,
  vec2,
  vec3,
  vec4,
  float,
  uniform,
  floor,
  length,
  smoothstep,
  mix,
  max,
  time,
  texture as tslTexture,
  Fn,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { simplexNoise3d } from "./simplexNoise3d";

/**
 * Halftone colorNode. Rotation happens in pixel space so circles stay
 * circular regardless of aspect ratio. Cell centers are inverse-rotated
 * back to UV space for texture sampling.
 */
export function createHalftoneColorNode(inputTexture: THREE.Texture) {
  const resolution = uniform(new THREE.Vector2(1, 1));
  const bgCol = new THREE.Color("#FCFCFB");
  const pixelSize = uniform(14.0);
  const dotRadius = uniform(1.15);
  const contrast = uniform(1.55);
  const invertLuma = uniform(1.0);
  const angle = uniform((45.0 * Math.PI) / 180.0);
  const bgColor = uniform(new THREE.Vector3(bgCol.r, bgCol.g, bgCol.b));

  // Animation
  const noiseSpeed = uniform(0.3);
  const noiseScale = uniform(1.5);
  const noiseAmount = uniform(0.15);

  // @ts-expect-error — TSL Fn destructured args aren't typed
  const colorNode = Fn(() => {
    const _uv = uv();

    // ── Pixel coordinates (square pixels) ────────────────────────────────────
    const pixelCoord = _uv.mul(resolution);
    const centerPx = resolution.mul(0.5);

    // ── Rotate pixel coords around screen center ─────────────────────────────
    const cosA = float(angle).cos();
    const sinA = float(angle).sin();
    const cp = pixelCoord.sub(centerPx);
    const rotatedPx = vec2(
      cosA.mul(cp.x).add(sinA.mul(cp.y)),
      cosA.mul(cp.y).sub(sinA.mul(cp.x)),
    ).add(centerPx);

    // ── Grid cell in rotated pixel space ─────────────────────────────────────
    const baseCellIndex = floor(rotatedPx.div(pixelSize));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let maxCircle: any = float(0.0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalR: any = float(0.0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalG: any = float(0.0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalB: any = float(0.0);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cellIndex = baseCellIndex.add(vec2(float(dx), float(dy)));
        const cellCenter = cellIndex.add(0.5).mul(pixelSize);

        // Inverse-rotate cell center back to original pixel space → UV
        const cc = cellCenter.sub(centerPx);
        const origPx = vec2(
          cosA.mul(cc.x).sub(sinA.mul(cc.y)),
          cosA.mul(cc.y).add(sinA.mul(cc.x)),
        ).add(centerPx);
        const cellUV = origPx.div(resolution);

        // Sample texture
        // Force LOD 0 — computed UVs have discontinuous derivatives at cell
        // boundaries which causes the GPU to sample wrong mip levels, producing
        // visible dotted outlines along every cell edge.
        const sample = tslTexture(inputTexture, cellUV).level(0);

        // Luminance → effective radius
        const luma = sample.r
          .mul(0.2126)
          .add(sample.g.mul(0.7152))
          .add(sample.b.mul(0.0722))
          .mul(contrast)
          .clamp(0.0, 1.0);
        const effectiveLuma = mix(
          luma,
          float(1.0).sub(luma),
          invertLuma,
        );

        // Simplex noise at cell center for organic breathing
        const noiseInput = vec3(
          cellUV.x.mul(noiseScale),
          cellUV.y.mul(noiseScale),
          time.mul(noiseSpeed),
        );
        // @ts-expect-error — TSL Fn call signature not inferred
        const noise = simplexNoise3d(noiseInput); // returns -1..1
        const radiusMod = float(1.0).add(noise.mul(noiseAmount));

        const radius = pixelSize.mul(dotRadius).mul(effectiveLuma).mul(radiusMod);

        // Distance in rotated pixel space (square pixels → true circles)
        const dist = length(rotatedPx.sub(cellCenter));

        const circle = float(1.0).sub(
          smoothstep(radius.sub(1.0), radius.add(1.0), dist),
        );

        const isNew = circle.greaterThan(maxCircle);
        finalR = isNew.select(float(sample.r), finalR);
        finalG = isNew.select(float(sample.g), finalG);
        finalB = isNew.select(float(sample.b), finalB);
        maxCircle = max(circle, maxCircle);
      }
    }

    const bg = vec3(float(bgColor.x), float(bgColor.y), float(bgColor.z));
    const finalColor = mix(bg, vec3(finalR, finalG, finalB), maxCircle);
    return vec4(finalColor, float(1.0));
  })();

  return {
    colorNode,
    uniforms: {
      resolution,
      pixelSize,
      dotRadius,
      contrast,
      invertLuma,
      angle,
      bgColor,
      noiseSpeed,
      noiseScale,
      noiseAmount,
    },
  };
}
