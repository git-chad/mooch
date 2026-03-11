import { add, Fn, mod, mul, sub } from "three/tsl";

// @ts-expect-error — TSL Fn destructured args aren't typed
export const permute = Fn(([x]) => {
  return mod(mul(add(mul(x, 34.0), 10.0), x), 289.0);
});

// @ts-expect-error — TSL Fn destructured args aren't typed
export const taylorInvSqrt = Fn(([r]) => {
  return sub(1.79284291400159, mul(0.85373472095314, r));
});
