// Small math helpers used across movement, aiming, and rendering.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const len = (x, y) => Math.hypot(x, y);
// Normalize a 2D vector; returns [0,0] as [0,0] via 1-length fallback.
export const norm = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
// Random float in [a, b).
export const rand = (a, b) => a + Math.random() * (b - a);
