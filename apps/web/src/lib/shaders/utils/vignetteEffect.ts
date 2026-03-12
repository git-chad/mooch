import { Fn, float, pow, smoothstep, uv, vec4 } from "three/tsl";
import { sdSphere } from "../sdSphere";

type VignetteEffectProps = {
  exponent?: number;
  inputColor: unknown;
  inputUV?: () => unknown;
  smoothing?: number;
};

// @ts-expect-error — TSL Fn object args typing isn't inferred well.
export const vignetteEffect = Fn((props: VignetteEffectProps) => {
  const { inputColor, inputUV = uv, smoothing = 0.25, exponent = 5 } =
    props || {};

  const _uv = inputUV().toVar();
  const centeredUV = _uv.sub(0.5).toVar();
  // @ts-expect-error — TSL Fn call signature is not inferred.
  const sphere = sdSphere(centeredUV).toVar();
  const vignette = float(1.0)
    .sub(smoothstep(float(smoothing), float(1.0), sphere))
    .toVar();
  const vignetteMask = pow(vignette, float(exponent)).toVar();
  return vec4(inputColor).mul(vignetteMask);
});
