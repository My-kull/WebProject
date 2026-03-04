// ECS world with component maps and simple multi-component queries.
export class World {
  constructor() {
    this.nextId = 1;
    this.alive = new Set();
    this.c = {
      Transform: new Map(),   // {x,y,z}
      Velocity: new Map(),    // {x,y}
      Collider: new Map(),    // {r}
      Render: new Map(),      // {kind, size, bob, hue}
      Health: new Map(),      // {hp, max}
      Shooter: new Map(),     // {cool, rate, speed, faction}
      Bullet: new Map(),      // {damage, faction, life}
      Enemy: new Map(),       // {type, t}
      Player: new Map(),      // {}
      Obstacle: new Map(),    // {type}
      Score: new Map(),       // {value}
    };
  }

  create() {
    const id = this.nextId++;
    this.alive.add(id);
    return id;
  }

  destroy(id) {
    this.alive.delete(id);
    for (const m of Object.values(this.c)) m.delete(id);
  }

  has(id, ...names) {
    return names.every((n) => this.c[n].has(id));
  }

  // Query the smallest component map first to reduce per-frame scans.
  view(...names) {
    if (names.length === 0) return Array.from(this.alive);
    if (names.length === 1) return Array.from(this.c[names[0]].keys());

    let baseMap = this.c[names[0]];
    for (let i = 1; i < names.length; i += 1) {
      const m = this.c[names[i]];
      if (m.size < baseMap.size) baseMap = m;
    }

    const out = [];
    for (const id of baseMap.keys()) {
      let ok = true;
      for (let i = 0; i < names.length; i += 1) {
        if (!this.c[names[i]].has(id)) {
          ok = false;
          break;
        }
      }
      if (ok && this.alive.has(id)) out.push(id);
    }
    return out;
  }
}
