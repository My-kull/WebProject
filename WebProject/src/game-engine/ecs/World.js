// Tiny ECS world: entities are ids with component maps.
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
      Score: new Map(),       // {value}
    };
  }

  // Create a new entity id.
  create() {
    const id = this.nextId++;
    this.alive.add(id);
    return id;
  }

  // Remove entity and all its components.
  destroy(id) {
    this.alive.delete(id);
    for (const m of Object.values(this.c)) m.delete(id);
  }

  // Check if entity has all component types.
  has(id, ...names) {
    return names.every((n) => this.c[n].has(id));
  }

  // Return ids that have all requested components.
  view(...names) {
    // iterate entities that have all components
    const out = [];
    for (const id of this.alive) {
      if (this.has(id, ...names)) out.push(id);
    }
    return out;
  }
}
