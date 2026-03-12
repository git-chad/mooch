import { Fn, float, mix, pow, sin, uv, vec3, vec4 } from "three/tsl";

type CRTScanlineEffectProps = {
  curvature?: number;
  inputColor: unknown;
  inputUV?: () => unknown;
  lineFrequency?: number;
  lineIntensity?: number;
  scanlineSharpness?: number;
};

// @ts-expect-error — TSL Fn object args typing isn't inferred well.
export const crtScanlineEffect = Fn((props: CRTScanlineEffectProps) => {
  const {
    inputColor,
    inputUV = uv,
    lineFrequency = 200,
    lineIntensity = 0.3,
    curvature = 0.2,
    scanlineSharpness = 0.5,
  } = props || {};

  const _uv = inputUV().toVar();
  const _lineFrequency = float(lineFrequency);
  const _lineIntensity = float(lineIntensity);
  const _curvature = float(curvature);
  const _scanlineSharpness = float(scanlineSharpness);

  const centered = _uv.sub(0.5).toVar();
  const distortion = centered
    .mul(_curvature.mul(centered.dot(centered)))
    .toVar();
  const distortedUV = _uv.add(distortion).toVar();

  const scanline = sin(distortedUV.y.mul(_lineFrequency).mul(3.14159)).toVar();
  const scanlinePattern = pow(
    scanline.mul(0.5).add(0.5),
    _scanlineSharpness,
  ).toVar();

  const effect = mix(
    float(1.0).sub(_lineIntensity),
    float(1.0),
    scanlinePattern,
  ).toVar();

  const originalColor = vec4(inputColor).toVar();
  const rgb = vec3(originalColor.x, originalColor.y, originalColor.z)
    .mul(effect)
    .toVar();
  return vec4(rgb, originalColor.w);
});
