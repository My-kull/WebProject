// Small math helpers used across movement, aiming, and rendering.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const len = (x, y) => Math.hypot(x, y);
export const norm = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
export const rand = (a, b) => a + Math.random() * (b - a);
