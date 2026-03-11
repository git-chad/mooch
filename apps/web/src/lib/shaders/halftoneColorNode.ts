import {
  Fn,
  float,
  floor,
  length,
  max,
  mix,
  smoothstep,
  time,
  texture as tslTexture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { simplexNoise3d } from "./simplexNoise3d";

export const HALFTONE_TRAIL_POINT_COUNT = 8;

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
  const pointer = uniform(new THREE.Vector2(0, 0));
  const hoverMix = uniform(0.0);
  const pointerRadius = uniform(0.8);
  const pointerBoost = uniform(0.52);
  const trailRadius = uniform(0.56);
  const trailBoost = uniform(0.7);
  const trailPoints = Array.from({ length: HALFTONE_TRAIL_POINT_COUNT }, () =>
    uniform(new THREE.Vector2(9, 9)),
  );
  const trailLives = Array.from({ length: HALFTONE_TRAIL_POINT_COUNT }, () =>
    uniform(0.0),
  );

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
    const aspect = resolution.x.div(max(resolution.y, float(1.0)));

    const maxCircle = float(0.0).toVar();
    const finalR = float(0.0).toVar();
    const finalG = float(0.0).toVar();
    const finalB = float(0.0).toVar();

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
        const cellNdc = cellUV.mul(2.0).sub(1.0);

        const pointerDelta = vec2(
          cellNdc.x.sub(pointer.x).mul(aspect),
          cellNdc.y.sub(pointer.y),
        );
        const interactionInfluence = smoothstep(
          pointerRadius,
          float(0.0),
          length(pointerDelta),
        )
          .mul(pointerBoost)
          .mul(hoverMix)
          .toVar();

        for (let i = 0; i < HALFTONE_TRAIL_POINT_COUNT; i++) {
          const trailDelta = vec2(
            cellNdc.x.sub(trailPoints[i].x).mul(aspect),
            cellNdc.y.sub(trailPoints[i].y),
          );
          const trailInfluence = smoothstep(
            trailRadius,
            float(0.0),
            length(trailDelta),
          )
            .mul(trailLives[i])
            .mul(hoverMix);
          interactionInfluence.assign(
            max(interactionInfluence, trailInfluence),
          );
        }

        // Sample texture
        // Force LOD 0 — computed UVs have discontinuous derivatives at cell
        // boundaries which causes the GPU to sample wrong mip levels, producing
        // visible dotted outlines along every cell edge.
        const sample = vec4(tslTexture(inputTexture, cellUV).level(float(0.0)));

        // Luminance → effective radius
        const luma = sample.x
          .mul(0.2126)
          .add(sample.y.mul(0.7152))
          .add(sample.z.mul(0.0722))
          .mul(contrast)
          .clamp(0.0, 1.0);
        const effectiveLuma = mix(luma, float(1.0).sub(luma), invertLuma);

        // Simplex noise at cell center for organic breathing
        const noiseInput = vec3(
          cellUV.x.mul(noiseScale),
          cellUV.y.mul(noiseScale),
          time.mul(noiseSpeed),
        );
        // @ts-expect-error — TSL Fn call signature not inferred
        const noise = simplexNoise3d(noiseInput); // returns -1..1
        const radiusMod = float(1.0).add(noise.mul(noiseAmount));

        const radius = pixelSize
          .mul(dotRadius)
          .mul(effectiveLuma)
          .mul(radiusMod);
        const interactiveRadius = radius.mul(
          float(1.0).add(interactionInfluence.mul(trailBoost)),
        );

        // Distance in rotated pixel space (square pixels → true circles)
        const dist = length(rotatedPx.sub(cellCenter));

        const circle = float(1.0).sub(
          smoothstep(
            interactiveRadius.sub(1.0),
            interactiveRadius.add(1.0),
            dist,
          ),
        );

        const isNew = circle.greaterThan(maxCircle);
        finalR.assign(isNew.select(float(sample.x), finalR));
        finalG.assign(isNew.select(float(sample.y), finalG));
        finalB.assign(isNew.select(float(sample.z), finalB));
        maxCircle.assign(max(circle, maxCircle));
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
      pointer,
      hoverMix,
      pointerRadius,
      pointerBoost,
      trailRadius,
      trailBoost,
      trailPoints,
      trailLives,
    },
  };
}
