import { Fn, float, length } from "three/tsl";

// @ts-expect-error — TSL Fn destructured args aren't typed
export const sdSphere = Fn(([_uv, r = float(0.0)]) => {
  const _r = float(r);
  return length(_uv).sub(_r);
});
