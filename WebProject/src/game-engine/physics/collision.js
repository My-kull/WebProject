// Collision helpers shared by gameplay systems.
export function circleHit(aPos, aR, bPos, bR) {
  const dx = aPos.x - bPos.x;
  const dy = aPos.y - bPos.y;
  const rr = aR + bR;
  return (dx * dx + dy * dy) <= rr * rr;
}
