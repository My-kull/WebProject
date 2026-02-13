// Isometric projection helpers shared by update/render systems.
function isoOrigin(camera, canvasW, canvasH, tileW, tileH) {
  const ox = canvasW * 0.5 - (camera.x - camera.y) * (tileW * 0.5);
  const oy = canvasH * 0.5 - (camera.x + camera.y) * (tileH * 0.5);
  return [ox, oy];
}

export function worldToScreen(pos, camera, canvasW, canvasH, tileW, tileH, zScale) {
  const [ox, oy] = isoOrigin(camera, canvasW, canvasH, tileW, tileH);
  const sx = (pos.x - pos.y) * (tileW * 0.5) + ox;
  const sy = (pos.x + pos.y) * (tileH * 0.5) - pos.z * zScale + oy;
  return { x: sx, y: sy };
}

export function screenToWorld(screen, camera, canvasW, canvasH, tileW, tileH) {
  const [ox, oy] = isoOrigin(camera, canvasW, canvasH, tileW, tileH);
  const dx = screen.x - ox;
  const dy = screen.y - oy;
  const a = tileW * 0.5;
  const b = tileH * 0.5;
  const x = (dy / b + dx / a) / 2;
  const y = (dy / b - dx / a) / 2;
  return { x, y, z: 0 };
}
