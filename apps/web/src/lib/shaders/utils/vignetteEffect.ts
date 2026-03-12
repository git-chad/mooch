import { Fn, float, pow, smoothstep, uv, vec4 } from "three/tsl";
import { sdSphere } from "../sdSphere";

type VignetteEffectProps = {
  exponent?: number;
  inputColor: unknown;
  inputUV?: () => unknown;
  smoothing?: number;
};

export const vignetteEffect = Fn((props: VignetteEffectProps) => {
  const { inputColor, inputUV = uv, smoothing = 0.25, exponent = 5 } =
    props || {};

  const textureUV = inputUV as () => { toVar: () => any };
  const sourceColor = inputColor as any;

  const _uv = textureUV().toVar();
  const centeredUV = _uv.sub(0.5).toVar();
  // @ts-expect-error — TSL Fn call signature is not inferred.
  const sphere = sdSphere(centeredUV).toVar();
  const vignette = float(1.0)
    .sub(smoothstep(float(smoothing), float(1.0), sphere))
    .toVar();
  const vignetteMask = pow(vignette, float(exponent)).toVar();
  return vec4(sourceColor).mul(vignetteMask);
});
