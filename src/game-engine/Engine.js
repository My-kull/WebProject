import { clamp, len, norm, rand } from "./core/utils.js";
import { Input } from "./core/Input.js";
import { World } from "./ecs/World.js";
import { screenToWorld, worldToScreen } from "./render/iso.js";
import { circleHit } from "./physics/collision.js";
import { drawDiamond, fillDiamond } from "./render/draw.js";
import { Assets } from "./assets/Assets.js";


// Core game loop, state, and rendering for the isometric demo.
export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    
    // Asset cache (images/sprites)
    this.assets = new Assets();
    this.ready = false;

    // Canvas sizing
    this._resizeHandler = () => this.resize();
    this.resize();
    window.addEventListener("resize", this._resizeHandler);

    // Input + ECS world
    this.input = new Input(canvas);
    this.world = new World();

    // Isometric grid settings
    this.tileW = 64;
    this.tileH = 32;
    this.zScale = 24;

    // Camera and world bounds
    this.camera = { x: 0, y: 0 };
    this.bounds = { minX: -12, maxX: 12, minY: -12, maxY: 12 };

    // Game state (waves, score, etc.)
    this.state = {
      time: 0,
      score: 0,
      gameOver: false,
      spawnTimer: 0,
      totalWaves: 10,
      waveSize: 10,
      wave: 1,
      enemiesSpawnedInWave: 0,
      enemiesKilledInWave: 0,
    };

    // Fixed timestep
    this.acc = 0;
    this.last = performance.now();
    this.fixedDt = 1 / 60;

    // debug
    this.fps = 0;
    this._fpsAcc = 0;
    this._fpsFrames = 0;

    this.running = false;
    this._rafId = null;
  }

  // Resize canvas backing store to match CSS size and DPR.
  resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
  }

  // Load assets and kick off the game loop.
  async start() {
    if (this.running) return;
    this.running = true;
    this.initGame();

    // Optional preloads (won't crash if missing; you’ll just see shapes)
    try {
      await this.assets.loadImage("player", "./src/assets/player.png");
      await this.assets.loadImage("enemy", "./src/assets/enemy.png");
      await this.assets.loadImage("bullet_player", "./src/assets/bullet_player.png");
      await this.assets.loadImage("bullet_enemy", "./src/assets/bullet_enemy.png");
      // Example sprite sheets grouped by section
      // await this.assets.loadSpriteSheetSection("player", "main", "./src/assets/player_sheet.png", 32, 32);
      // await this.assets.loadSpriteSheetSection("enemy", "swirler", "./src/assets/enemy_sheet.png", 32, 32);
    } catch (e) {
      // Keep running with fallback shapes
      console.warn(e.message);
    }

    this.ready = true;
    this._rafId = requestAnimationFrame((t) => this.frame(t));
  }


  // Set up initial entities and wave state.
  initGame() {
    // Player
    const p = this.world.create();
    this.world.c.Player.set(p, {});
    this.world.c.Transform.set(p, { x: 0, y: 6, z: 0 });
    this.world.c.Velocity.set(p, { x: 0, y: 0 });
    this.world.c.Collider.set(p, { r: 0.35 });
    this.world.c.Render.set(p, { kind: "diamond", size: 0.8, bob: 0.0, hue: 195 });
    this.world.c.Health.set(p, { hp: 8, max: 8 });
    this.world.c.Shooter.set(p, { cool: 0, rate: 10, speed: 10, faction: "player" });
    this.playerId = p;

    this.world.c.Render.set(p, {
      kind: "diamond",
      size: 0.8,
      bob: 0.0,
      hue: 195,
      spriteKey: "player",
      anchor: { x: 0.5, y: 1.0 },
    });


    // Score entity (optional but shows ECS pattern)
    const s = this.world.create();
    this.world.c.Score.set(s, { value: 0 });
    this.scoreId = s;

    // Start wave spawning immediately
    this.state.spawnTimer = 0;
  }

  // Main RAF frame: fixed-step update, then render.
  frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    // fps estimate
    this._fpsAcc += dt;
    this._fpsFrames++;
    if (this._fpsAcc >= 0.25) {
      this.fps = Math.round(this._fpsFrames / this._fpsAcc);
      this._fpsAcc = 0;
      this._fpsFrames = 0;
    }

    this.acc += dt;
    while (this.acc >= this.fixedDt) {
      this.update(this.fixedDt);
      this.acc -= this.fixedDt;
    }
    this.render();

    this.input.endFrame();
    this._rafId = requestAnimationFrame((t) => this.frame(t));
  }

  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener("resize", this._resizeHandler);
    if (this.input?.destroy) this.input.destroy();
  }

  // Fixed-step simulation.
  update(dt) {
    if (this.state.gameOver) return;

    this.updateAnimations(dt);

    this.state.time += dt;

    // --- player control ---
    const p = this.playerId;
    const t = this.world.c.Transform.get(p);
    const v = this.world.c.Velocity.get(p);

    let ax = 0, ay = 0;
    if (this.input.isDown("KeyA")) ax -= 1;
    if (this.input.isDown("KeyD")) ax += 1;
    if (this.input.isDown("KeyW")) ay -= 1;
    if (this.input.isDown("KeyS")) ay += 1;
    const [nx, ny] = norm(ax, ay);
    const speed = 6.5;
    v.x = nx * speed;
    v.y = ny * speed;

    // --- camera follows player ---
    this.camera.x = t.x;
    this.camera.y = t.y;

    // --- shooting ---
    const shooter = this.world.c.Shooter.get(p);
    shooter.cool = Math.max(0, shooter.cool - dt);

    const wantsShoot =
      this.input.isDown("Space") || this.input.mouse.down || this.input.mouse.pressed;

    if (wantsShoot && shooter.cool <= 0) {
      shooter.cool = 1 / shooter.rate;

      // Aim via mouse world position (z=0 plane). If mouse is "too close", shoot forward.
      const aimW = screenToWorld(
        { x: this.input.mouse.x, y: this.input.mouse.y },
        this.camera,
        this.canvas.width,
        this.canvas.height,
        this.tileW,
        this.tileH
      );
      let dx = aimW.x - t.x;
      let dy = aimW.y - t.y;
      if (len(dx, dy) < 0.1) { dx = 0; dy = -1; }
      const [sx, sy] = norm(dx, dy);

      this.spawnBullet(t.x, t.y, sx, sy, "player", 0.16, 1);
    }

    // --- movement integration ---
    for (const id of this.world.view("Transform", "Velocity")) {
      const tr = this.world.c.Transform.get(id);
      const vel = this.world.c.Velocity.get(id);
      tr.x += vel.x * dt;
      tr.y += vel.y * dt;

      // world bounds clamp
      tr.x = clamp(tr.x, this.bounds.minX, this.bounds.maxX);
      tr.y = clamp(tr.y, this.bounds.minY, this.bounds.maxY);
    }

    // --- enemy AI (simple: drift + shoot at player) ---
    for (const id of this.world.view("Enemy", "Transform", "Velocity", "Shooter")) {
      const et = this.world.c.Transform.get(id);
      const ev = this.world.c.Velocity.get(id);
      const enemy = this.world.c.Enemy.get(id);
      const es = this.world.c.Shooter.get(id);

      enemy.t += dt;

      // move pattern: swirl + slight pursuit
      const toPx = t.x - et.x;
      const toPy = t.y - et.y;
      const [px, py] = norm(toPx, toPy);

      const swirl = 0.9;
      const sx = Math.cos(enemy.t * 1.7) * swirl;
      const sy = Math.sin(enemy.t * 1.3) * swirl;

      ev.x = (px * 2.2 + sx) * 1.2;
      ev.y = (py * 2.2 + sy) * 1.2;

      // shooting
      es.cool = Math.max(0, es.cool - dt);
      if (es.cool <= 0) {
        es.cool = 1 / es.rate;
        const [bx, by] = norm(toPx, toPy);
        this.spawnBullet(et.x, et.y, bx, by, "enemy", 0.14, 1);
      }
    }

    // --- bullets lifetime ---
    for (const id of this.world.view("Bullet")) {
      const b = this.world.c.Bullet.get(id);
      b.life -= dt;
      if (b.life <= 0) this.world.destroy(id);
    }

    // --- collisions: bullets hit stuff ---
    // Note: O(n^2) but fine for a mini-engine. Upgrade with spatial hashing later.
    const bullets = this.world.view("Bullet", "Transform", "Collider");
    const enemies = this.world.view("Enemy", "Transform", "Collider", "Health");
    const player = this.playerId;

    for (const bid of bullets) {
      const bt = this.world.c.Transform.get(bid);
      const bc = this.world.c.Collider.get(bid);
      const b = this.world.c.Bullet.get(bid);

      if (b.faction === "player") {
        for (const eid of enemies) {
          const et = this.world.c.Transform.get(eid);
          const ec = this.world.c.Collider.get(eid);
          if (!et || !ec) continue;
          if (circleHit(bt, bc.r, et, ec.r)) {
            this.world.destroy(bid);
            this.damage(eid, b.damage);
            break;
          }
        }
      } else {
        const pt = this.world.c.Transform.get(player);
        const pc = this.world.c.Collider.get(player);
        if (circleHit(bt, bc.r, pt, pc.r)) {
          this.world.destroy(bid);
          this.damage(player, b.damage);
        }
      }
    }

    // --- spawn logic (waves) ---
    if (this.state.wave <= this.state.totalWaves) {
      this.state.spawnTimer -= dt;
      if (this.state.spawnTimer <= 0 && this.state.enemiesSpawnedInWave < this.state.waveSize) {
        this.state.spawnTimer = rand(0.6, 1.2);
        this.spawnEnemy();
        this.state.enemiesSpawnedInWave += 1;
      }
    }

    // Advance wave once all enemies in the wave are dead
    if (
      this.state.enemiesKilledInWave >= this.state.waveSize &&
      this.world.view("Enemy").length === 0
    ) {
      this.state.wave += 1;
      this.state.enemiesSpawnedInWave = 0;
      this.state.enemiesKilledInWave = 0;
      this.state.spawnTimer = 0;
    }

    // Game over when player dies or after last wave is cleared
    const hp = this.world.c.Health.get(player)?.hp ?? 0;
    if (hp <= 0) this.state.gameOver = true;
    if (
      this.state.wave > this.state.totalWaves &&
      this.world.view("Enemy").length === 0
    ) {
      this.state.gameOver = true;
    }
  }

  // Apply damage, handle deaths, and update score/wave.
  damage(id, amount) {
    const h = this.world.c.Health.get(id);
    if (!h) return;
    h.hp -= amount;

    // little feedback: bump z for a frame via Render.bob
    const r = this.world.c.Render.get(id);
    if (r) r.bob = 0.22;

    // If enemy dies, score + wave progress
    if (h.hp <= 0) {
      if (this.world.c.Enemy.has(id)) {
        this.state.score += 100;
        this.state.enemiesKilledInWave += 1;
      }
      if (this.world.c.Player.has(id)) {
        // keep player entity so update/render don't crash
        h.hp = 0;
      } else {
        this.world.destroy(id);
      }
    }
  }

  // Sprite sheet animation progression.
  updateAnimations(dt) {
    for (const id of this.world.view("Render")) {
      const r = this.world.c.Render.get(id);
      if (!r?.anim) continue;

      const start = r.anim.start ?? 0;
      const end = r.anim.end ?? start;
      const fps = r.anim.fps ?? 8;
      const loop = r.anim.loop ?? true;

      const frameCount = Math.max(1, end - start + 1);
      const frameDur = 1 / fps;
      const totalDur = frameCount * frameDur;

      r.animTime = (r.animTime ?? 0) + dt;
      let t = r.animTime;
      if (loop) {
        t = totalDur > 0 ? t % totalDur : 0;
      } else {
        t = Math.min(t, Math.max(0, totalDur - 1e-6));
      }

      const idx = Math.floor(t / frameDur);
      r.frame = start + Math.min(frameCount - 1, idx);
    }
  }

  // Assign animation settings to a renderable.
  setAnimation(id, anim) {
    const r = this.world.c.Render.get(id);
    if (!r) return;
    r.anim = { ...anim };
    r.animTime = 0;
    r.frame = r.anim.start ?? 0;
  }

  // Create a bullet entity.
  spawnBullet(x, y, dx, dy, faction, radius, damage) {
    const b = this.world.create();
    this.world.c.Render.set(b, {
      kind: "dot",
      size: 0.35,
      bob: 0.0,
      hue: faction === "player" ? 55 : 0,
      spriteKey: faction === "player" ? "bullet_player" : "bullet_enemy",
      anchor: { x: 0.5, y: 0.5 },
    });

    this.world.c.Transform.set(b, { x, y, z: 0 });
    this.world.c.Velocity.set(b, { x: dx * (faction === "player" ? 12 : 8), y: dy * (faction === "player" ? 12 : 8) });
    this.world.c.Collider.set(b, { r: radius });
    this.world.c.Bullet.set(b, { damage, faction, life: 2.2 });
    this.world.c.Render.set(b, { kind: "dot", size: 0.35, bob: 0.0, hue: faction === "player" ? 55 : 0 });
  }

  // Create an enemy entity.
  spawnEnemy() {
    const e = this.world.create();
    const side = Math.random() < 0.5 ? -1 : 1;
    const ex = rand(this.bounds.minX, this.bounds.maxX);
    const ey = side < 0 ? this.bounds.minY - 2 : this.bounds.maxY + 2;

    this.world.c.Render.set(e, {
      kind: "diamond",
      size: 0.9,
      bob: 0.0,
      hue: 345,
      spriteKey: "enemy",
      anchor: { x: 0.5, y: 1.0 },
    });

    this.world.c.Enemy.set(e, { type: "swirler", t: rand(0, 10) });
    this.world.c.Transform.set(e, { x: ex, y: ey, z: 0 });
    this.world.c.Velocity.set(e, { x: 0, y: 0 });
    this.world.c.Collider.set(e, { r: 0.42 });
    this.world.c.Render.set(e, { kind: "diamond", size: 0.9, bob: 0.0, hue: 345 });
    this.world.c.Health.set(e, { hp: 3, max: 3 });
    this.world.c.Shooter.set(e, { cool: rand(0.1, 0.6), rate: rand(0.8, 1.4), speed: 8, faction: "enemy" });
  }

  // Render world, UI, and game-over overlay.
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, w, h);

    // iso grid
    this.drawGrid(14);

    // gather renderables and depth-sort by screenY (painter's algorithm)
    const ids = this.world.view("Transform", "Render");
    const list = ids.map((id) => {
      const tr = this.world.c.Transform.get(id);
      const r = this.world.c.Render.get(id);

      // decay bob (cheap "hit" feedback)
      if (r.bob > 0) r.bob = Math.max(0, r.bob - 0.02);

      const pos = { x: tr.x, y: tr.y, z: tr.z + r.bob };
      const s = worldToScreen(pos, this.camera, w, h, this.tileW, this.tileH, this.zScale);
      return { id, s, tr, r };
    });

    list.sort((a, b) => a.s.y - b.s.y);

    for (const it of list) {
      this.drawEntity(it);
    }

    // UI
    this.drawUI();

    if (this.state.gameOver) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e8eef5";
      ctx.font = `${Math.floor(h * 0.06)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", w * 0.5, h * 0.45);
      ctx.font = `${Math.floor(h * 0.03)}px system-ui, sans-serif`;
      ctx.fillText(`Score: ${this.state.score}`, w * 0.5, h * 0.52);
      ctx.restore();
    }
  }

  // Draw isometric ground tiles around the camera.
  drawGrid(radius) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const pos = { x, y, z: 0 };
        const s = worldToScreen(pos, this.camera, w, h, this.tileW, this.tileH, this.zScale);

        // subtle checker
        const odd = (x + y) & 1;
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = odd ? "#2a3644" : "#24303d";
        drawDiamond(ctx, s.x, s.y, this.tileW * 0.5, this.tileH * 0.5);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  // Draw one entity (sprite or fallback shape) and its health bar.
  drawEntity({ id, s, r }) {
    const ctx = this.ctx;

    // If a sprite (sheet or image) is configured and loaded, draw it
    if (r.spriteSheet || r.spriteSheetSection) {
      const frameIndex = r.frame ?? 0;
      const fr = r.spriteSheetSection
        ? this.assets.getFrameRectSection(r.spriteSheetSection, r.spriteSheetKey, frameIndex)
        : this.assets.getFrameRect(r.spriteSheet, frameIndex);
      if (fr) {
        const ax = r.anchor?.x ?? 0.5;
        const ay = r.anchor?.y ?? 1.0;

        const sizePx = r.size * this.tileH;
        const scale = r.pixelScale ?? (sizePx / Math.max(fr.sw, fr.sh));

        const dw = fr.sw * scale;
        const dh = fr.sh * scale;
        const dx = s.x - dw * ax;
        const dy = s.y - dh * ay;

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, dx, dy, dw, dh);
        this.drawHealthBar(id, s, sizePx);
        return;
      }
    } else if (r.spriteKey) {
      const img = this.assets.getImage(r.spriteKey);
      if (img) {
        // Anchor defaults to "feet on tile": bottom-center
        const ax = r.anchor?.x ?? 0.5;
        const ay = r.anchor?.y ?? 1.0;

        // Decide draw size:
        // If pixelScale is set, scale image by that factor.
        // Otherwise scale by your existing sizePx logic.
        const sizePx = r.size * this.tileH;
        const scale = r.pixelScale ?? (sizePx / Math.max(img.width, img.height));

        const dw = img.width * scale;
        const dh = img.height * scale;

        const dx = s.x - dw * ax;
        const dy = s.y - dh * ay;

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, dx, dy, dw, dh);

        // Optional: health bar stays on top
        this.drawHealthBar(id, s, sizePx);
        return;
      }
    }

    // Fallback: your existing primitive rendering
    const sizePx = r.size * (this.tileH);
    const fill = `hsl(${r.hue} 85% 60%)`;
    const stroke = `hsl(${r.hue} 85% 25%)`;

    if (r.kind === "diamond") {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      fillDiamond(ctx, s.x, s.y, sizePx * 0.9, sizePx * 0.55);
    } else if (r.kind === "dot") {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(s.x, s.y, sizePx * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawHealthBar(id, s, sizePx);
  }

  // Render a health bar above entities that have Health.
  drawHealthBar(id, s, sizePx) {
    const ctx = this.ctx;
    const health = this.world.c.Health.get(id);
    if (!health) return;

    const pct = clamp(health.hp / health.max, 0, 1);
    const bw = sizePx * 0.85;
    const bh = 6;

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(s.x - bw / 2, s.y - sizePx * 0.8, bw, bh);
    ctx.fillStyle = `hsl(${pct * 120} 85% 55%)`;
    ctx.fillRect(s.x - bw / 2, s.y - sizePx * 0.8, bw * pct, bh);
    ctx.globalAlpha = 1.0;
  }

  // Draw HUD (player HP, score, fps).
  drawUI() {
    const ctx = this.ctx;
    const w = this.canvas.width;

    const pHealth = this.world.c.Health.get(this.playerId);
    const hp = Math.max(0, pHealth.hp);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(10, 10, 240, 64);

    ctx.fillStyle = "#e8eef5";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(`HP: ${hp}/${pHealth.max}`, 20, 34);
    ctx.fillText(`Score: ${this.state.score}`, 20, 56);

    ctx.textAlign = "right";
    ctx.fillText(`${this.fps} fps`, w - 14, 26);
    ctx.restore();
  }
}
