import { clamp, len, norm, rand } from "./core/utils.js";
import { Input } from "./core/Input.js";
import { World } from "./ecs/World.js";
import { screenToWorld, worldToScreen } from "./render/iso.js";
import { circleHit } from "./physics/collision.js";
import { drawDiamond, fillDiamond } from "./render/draw.js";
import { Assets } from "./assets/Assets.js";
import { QuestBroker } from "../ai/QuestBroker.js";


// Main game loop: update, ECS simulation, render, and quest state.
export class Engine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onEnterGame = typeof options.onEnterGame === "function" ? options.onEnterGame : null;
    
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
    this.baseWaveSize = 10;
    this.baseEnemyHealth = 3;
    this.baseEnemyDamage = 1;

    // Game state (waves, score, etc.)
    this.state = {
      time: 0,
      score: 0,
      coins: 0,
      levelUpFlash: 0,
      inStartArea: true,
      inShop: false,
      gameOver: false,
      spawnTimer: 0,
      totalWaves: 10,
      waveSize: this.baseWaveSize,
      wave: 1,
      enemiesSpawnedInWave: 0,
      enemiesKilledInWave: 0,
      deathCount: 0,
      questLog: [],
      activeQuest: null,
      questDialog: ["Press Q to ask the blacksmith for a quest."],
      questStatus: "No active quest",
      questProgress: 0,
      questCompletedNotice: 0,
    };
    this.player = {
      level: 1,
      points: 0,
      pointsToNextLevel: 300,
    };
    this.questBroker = new QuestBroker();
    this.questRequestInFlight = false;
    this.questRequestId = 0;
    this.startButtonRect = { x: 0, y: 0, w: 0, h: 0 };
    this.shopUi = {
      continueButton: { x: 0, y: 0, w: 0, h: 0 },
      upgradeButtons: {},
      notice: "",
    };
    this.playerWeapon = {
      speedLevel: 0,
      multiLevel: 0,
      backfireLevel: 0,
    };
    this.worldData = {
      npcId: "npc_blacksmith",
      regionId: "region_forge_district",
      nearbyItems: [
        { id: "item_iron_ore", name: "Iron Ore" },
        { id: "item_coal", name: "Coal" },
        { id: "item_ash_wood", name: "Ash Wood" },
      ],
      nearbyAreas: [
        { id: "area_old_quarry", name: "Old Quarry" },
        { id: "area_river_pass", name: "River Pass" },
      ],
    };

    // Fixed timestep
    this.acc = 0;
    this.last = performance.now();
    this.fixedDt = 1 / 60;

    this.fps = 0;
    this._fpsAcc = 0;
    this._fpsFrames = 0;
    this._renderList = [];

    this.running = false;
    this._rafId = null;
  }

  resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
    this.input?.updateCanvasMetrics?.();
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.initGame();

    // Asset preload is optional; rendering falls back to primitives when missing.
    try {
      await this.assets.loadImage("player", "./src/assets/player.png");
      await this.assets.loadImage("enemy", "./src/assets/enemy.png");
      await this.assets.loadImage("bullet_player", "./src/assets/bullet_player.png");
      await this.assets.loadImage("bullet_enemy", "./src/assets/bullet_enemy.png");
      // await this.assets.loadSpriteSheetSection("player", "main", "./src/assets/player_sheet.png", 32, 32);
      // await this.assets.loadSpriteSheetSection("enemy", "swirler", "./src/assets/enemy_sheet.png", 32, 32);
    } catch (e) {
      console.warn(e.message);
    }

    this.ready = true;
    this._rafId = requestAnimationFrame((t) => this.frame(t));
  }


  initGame() {
    const p = this.world.create();
    this.world.c.Player.set(p, {});
    this.world.c.Transform.set(p, { x: 0, y: 6, z: 0 });
    this.world.c.Velocity.set(p, { x: 0, y: 0 });
    this.world.c.Collider.set(p, { r: 0.35 });
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

    const s = this.world.create();
    this.world.c.Score.set(s, { value: 0 });
    this.scoreId = s;

    // Static geometry that blocks movement and projectiles.
    this.spawnObstacles();

    this.state.spawnTimer = 0;
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

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

  update(dt) {
    if (this.state.gameOver) return;

    // Player control and camera follow.
    this.updateAnimations(dt);
    this.state.levelUpFlash = Math.max(0, this.state.levelUpFlash - dt);
    this.state.questCompletedNotice = Math.max(0, this.state.questCompletedNotice - dt);

    this.state.time += dt;

    if (this.state.inStartArea) {
      if (this.input.mouse.pressed && this.isInRect(this.input.mouse.x, this.input.mouse.y, this.startButtonRect)) {
        this.state.inStartArea = false;
        this.onEnterGame?.();
        this.requestQuest();
      }
      return;
    }

    if (this.state.inShop) {
      if (this.input.mouse.pressed) {
        const mx = this.input.mouse.x;
        const my = this.input.mouse.y;
        if (this.isInRect(mx, my, this.shopUi.continueButton)) {
          this.continueFromShop();
        } else {
          for (const [id, rect] of Object.entries(this.shopUi.upgradeButtons)) {
            if (this.isInRect(mx, my, rect)) {
              this.purchaseUpgrade(id);
              break;
            }
          }
        }
      }
      return;
    }

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

    this.camera.x = t.x;
    this.camera.y = t.y;

    // Combat input, movement, and AI.
    const shooter = this.world.c.Shooter.get(p);
    shooter.cool = Math.max(0, shooter.cool - dt);

    const wantsShoot =
      this.input.isDown("Space") || this.input.mouse.down || this.input.mouse.pressed;

    if (wantsShoot && shooter.cool <= 0) {
      shooter.cool = 1 / shooter.rate;

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

      this.firePlayerShot(t.x, t.y, sx, sy);
    }

    if (this.input.wasPressed("KeyQ")) {
      this.requestQuest();
    }

    const obstacles = this.world.view("Obstacle", "Transform", "Collider");
    for (const id of this.world.view("Transform", "Velocity")) {
      const tr = this.world.c.Transform.get(id);
      const vel = this.world.c.Velocity.get(id);
      const col = this.world.c.Collider.get(id);
      const nextX = clamp(tr.x + vel.x * dt, this.bounds.minX, this.bounds.maxX);
      const nextY = clamp(tr.y + vel.y * dt, this.bounds.minY, this.bounds.maxY);

      if (this.world.c.Bullet.has(id) || !col) {
        tr.x = nextX;
        tr.y = nextY;
        continue;
      }

      if (!this.hitsObstacle(id, nextX, tr.y, col.r, obstacles)) {
        tr.x = nextX;
      }
      if (!this.hitsObstacle(id, tr.x, nextY, col.r, obstacles)) {
        tr.y = nextY;
      }
    }

    for (const id of this.world.view("Enemy", "Transform", "Velocity", "Shooter")) {
      const et = this.world.c.Transform.get(id);
      const ev = this.world.c.Velocity.get(id);
      const enemy = this.world.c.Enemy.get(id);
      const es = this.world.c.Shooter.get(id);

      enemy.t += dt;

      const toPx = t.x - et.x;
      const toPy = t.y - et.y;
      const [px, py] = norm(toPx, toPy);

      const swirl = 0.9;
      const sx = Math.cos(enemy.t * 1.7) * swirl;
      const sy = Math.sin(enemy.t * 1.3) * swirl;

      ev.x = (px * 2.2 + sx) * 1.2;
      ev.y = (py * 2.2 + sy) * 1.2;

      es.cool = Math.max(0, es.cool - dt);
      if (es.cool <= 0) {
        es.cool = 1 / es.rate;
        const [bx, by] = norm(toPx, toPy);
        this.spawnBullet(et.x, et.y, bx, by, "enemy", 0.14, this.enemyDamageValue());
      }
    }

    // Projectile lifetime and collisions.
    for (const id of this.world.view("Bullet")) {
      const b = this.world.c.Bullet.get(id);
      b.life -= dt;
      if (b.life <= 0) this.world.destroy(id);
    }

    const bullets = this.world.view("Bullet", "Transform", "Collider");
    const enemies = this.world.view("Enemy", "Transform", "Collider", "Health");
    const bulletBlockers = this.world.view("Obstacle", "Transform", "Collider");
    const player = this.playerId;
    const pt = this.world.c.Transform.get(player);
    const pc = this.world.c.Collider.get(player);

    for (const bid of bullets) {
      const bt = this.world.c.Transform.get(bid);
      const bc = this.world.c.Collider.get(bid);
      const b = this.world.c.Bullet.get(bid);
      let blocked = false;

      for (const oid of bulletBlockers) {
        const ot = this.world.c.Transform.get(oid);
        const oc = this.world.c.Collider.get(oid);
        if (!ot || !oc) continue;
        if (circleHit(bt, bc.r, ot, oc.r)) {
          this.world.destroy(bid);
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

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
        if (circleHit(bt, bc.r, pt, pc.r)) {
          this.world.destroy(bid);
          this.damage(player, b.damage);
        }
      }
    }

    // Wave progression and game-over.
    if (this.state.wave <= this.state.totalWaves) {
      this.state.spawnTimer -= dt;
      if (this.state.spawnTimer <= 0 && this.state.enemiesSpawnedInWave < this.state.waveSize) {
        this.state.spawnTimer = rand(0.6, 1.2);
        this.spawnEnemy();
        this.state.enemiesSpawnedInWave += 1;
      }
    }

    const enemiesAlive = this.world.view("Enemy").length;
    if (
      this.state.enemiesKilledInWave >= this.state.waveSize &&
      enemiesAlive === 0
    ) {
      this.state.wave += 1;
      this.state.enemiesSpawnedInWave = 0;
      this.state.enemiesKilledInWave = 0;
      this.state.spawnTimer = 0;
    }

    const hp = this.world.c.Health.get(player)?.hp ?? 0;
    if (hp <= 0) {
      this.enterShop();
      return;
    }
    if (
      this.state.wave > this.state.totalWaves &&
      enemiesAlive === 0
    ) {
      this.state.gameOver = true;
    }
  }

  damage(id, amount) {
    const h = this.world.c.Health.get(id);
    if (!h) return;
    h.hp -= amount;

    const r = this.world.c.Render.get(id);
    if (r) r.bob = 0.22;

    if (h.hp <= 0) {
      if (this.world.c.Enemy.has(id)) {
        const enemyType = this.world.c.Enemy.get(id)?.type ?? "unknown";
        this.onEnemyDefeated(`enemy_${enemyType}`);
        this.addPoints(100);
        this.addCoins(10);
        this.state.enemiesKilledInWave += 1;
      }
      if (this.world.c.Player.has(id)) {
        h.hp = 0;
      } else {
        this.world.destroy(id);
      }
    }
  }

  onEnemyDefeated(enemyTypeId) {
    const q = this.state.activeQuest;
    if (!q || q.type !== "defeat") return;
    const targetId = String(q.objective?.targetId ?? "").toLowerCase();
    const defeatedId = String(enemyTypeId ?? "").toLowerCase();
    const acceptsAnyEnemy = targetId === "" || targetId === "enemy_unknown" || targetId === "enemy_any";
    if (!acceptsAnyEnemy && targetId !== defeatedId) return;

    this.state.questProgress += 1;
    if (this.state.questProgress >= q.objective.count) {
      this.state.questProgress = q.objective.count;
      this.addPoints(q.reward?.xp ?? 0);
      this.addCoins(200);
      this.state.questCompletedNotice = 2.2;
      this.state.questStatus = `Completed: ${q.title}`;
      this.state.questDialog = q?.dialog?.complete?.length
        ? q.dialog.complete
        : ["Target cleared. Report complete."];
      this.state.activeQuest = null;
    }
  }

  ensureCombatQuest(quest, context) {
    const nearbyEnemy = context.nearbyEnemies?.[0];
    const targetId = nearbyEnemy?.id ?? "enemy_swirler";
    const targetName = nearbyEnemy?.name ?? "Swirler Enemy";
    const countFromQuest = Number(quest?.objective?.count);
    const count = Number.isFinite(countFromQuest) ? Math.max(1, Math.floor(countFromQuest)) : 3;
    const rewardXp = Number(quest?.reward?.xp);
    const rewardGold = Number(quest?.reward?.gold);

    if (quest?.type === "defeat" && typeof quest?.objective?.targetId === "string") {
      return {
        ...quest,
        objective: {
          ...quest.objective,
          targetId: quest.objective.targetId || targetId,
          count,
        },
      };
    }

    const qid = `combat_${context.npcId}_${context.regionId}_${Date.now()}`;
    return {
      id: qid,
      npcId: context.npcId,
      title: `Bounty: Eliminate ${targetName}`,
      type: "defeat",
      objective: { targetId, count },
      reward: {
        xp: Number.isFinite(rewardXp) ? rewardXp : 80,
        gold: Number.isFinite(rewardGold) ? rewardGold : 20,
        itemId: null,
      },
      dialog: {
        offer: [`Clean up the area.`, `Defeat ${count}x ${targetName}.`],
        accept: [`Understood. Make it count.`],
        complete: [`Good work. Bounty paid.`],
      },
    };
  }

  pointsForNextLevel(level) {
    return 300 + Math.max(0, level - 1) * 150;
  }

  addPoints(amount) {
    const points = Math.max(0, Math.floor(amount));
    if (points <= 0) return;

    this.state.score += points;
    this.player.points += points;

    while (this.player.points >= this.player.pointsToNextLevel) {
      this.player.points -= this.player.pointsToNextLevel;
      this.player.level += 1;
      this.player.pointsToNextLevel = this.pointsForNextLevel(this.player.level);
      this.state.levelUpFlash = 1.1;
    }
  }

  addCoins(amount) {
    const coins = Math.max(0, Math.floor(amount));
    if (coins <= 0) return;
    this.state.coins += coins;
  }

  enemyScale() {
    return Math.pow(1.25, this.state.deathCount);
  }

  enemyCountScale() {
    return Math.pow(2, this.state.deathCount);
  }

  scaledWaveSize() {
    return Math.max(1, Math.floor(this.baseWaveSize * this.enemyCountScale()));
  }

  enemyHealthValue() {
    return Math.max(1, Math.floor(this.baseEnemyHealth * this.enemyScale()));
  }

  enemyDamageValue() {
    return Math.max(1, Math.ceil(this.baseEnemyDamage * this.enemyScale()));
  }

  rotateDir(dx, dy, radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return [dx * c - dy * s, dx * s + dy * c];
  }

  playerProjectileSpeed() {
    return 12 * (1 + this.playerWeapon.speedLevel * 0.22);
  }

  firePlayerShot(x, y, dx, dy) {
    const speed = this.playerProjectileSpeed();
    const frontCount = 1 + this.playerWeapon.multiLevel * 2;
    const frontStep = 0.18;
    const center = (frontCount - 1) * 0.5;

    for (let i = 0; i < frontCount; i += 1) {
      const offset = (i - center) * frontStep;
      const [rx, ry] = this.rotateDir(dx, dy, offset);
      const [nx, ny] = norm(rx, ry);
      this.spawnBullet(x, y, nx, ny, "player", 0.16, 1, speed);
    }

    const backCount = this.playerWeapon.backfireLevel;
    if (backCount > 0) {
      const [bx, by] = norm(-dx, -dy);
      const step = 0.22;
      const backCenter = (backCount - 1) * 0.5;
      for (let i = 0; i < backCount; i += 1) {
        const offset = (i - backCenter) * step;
        const [rx, ry] = this.rotateDir(bx, by, offset);
        const [nx, ny] = norm(rx, ry);
        this.spawnBullet(x, y, nx, ny, "player", 0.14, 1, speed);
      }
    }
  }

  clearCombatEntities() {
    for (const id of this.world.view("Enemy")) this.world.destroy(id);
    for (const id of this.world.view("Bullet")) this.world.destroy(id);
  }

  enterShop() {
    if (this.state.inShop) return;
    this.state.inShop = true;
    this.state.deathCount += 1;
    this.state.waveSize = this.scaledWaveSize();
    this.shopUi.notice = `You were defeated. Enemy count x${this.enemyCountScale().toFixed(2)} active.`;
    this.clearCombatEntities();
  }

  continueFromShop() {
    const p = this.playerId;
    const t = this.world.c.Transform.get(p);
    const v = this.world.c.Velocity.get(p);
    const h = this.world.c.Health.get(p);
    const shooter = this.world.c.Shooter.get(p);

    if (t) {
      t.x = 0;
      t.y = 6;
      t.z = 0;
    }
    if (v) {
      v.x = 0;
      v.y = 0;
    }
    if (h) h.hp = h.max;
    if (shooter) shooter.cool = 0;

    this.clearCombatEntities();
    this.state.inShop = false;
    this.state.gameOver = false;
    this.state.wave = 1;
    this.state.enemiesSpawnedInWave = 0;
    this.state.enemiesKilledInWave = 0;
    this.state.spawnTimer = 0.1;
    this.state.questProgress = 0;
    this.state.activeQuest = null;
    this.state.questStatus = "No active quest";
    this.shopUi.notice = "";
    this.requestQuest();
  }

  getUpgradeOptions() {
    return [
      {
        id: "multi",
        title: "Cone Spread",
        level: this.playerWeapon.multiLevel,
        maxLevel: 4,
        cost: 140 + this.playerWeapon.multiLevel * 90,
        desc: "Adds two forward projectiles per level.",
      },
      {
        id: "speed",
        title: "Muzzle Velocity",
        level: this.playerWeapon.speedLevel,
        maxLevel: 5,
        cost: 110 + this.playerWeapon.speedLevel * 80,
        desc: "Increases projectile speed by 22% per level.",
      },
      {
        id: "backfire",
        title: "Backfire",
        level: this.playerWeapon.backfireLevel,
        maxLevel: 3,
        cost: 170 + this.playerWeapon.backfireLevel * 120,
        desc: "Adds rear shots while firing.",
      },
    ];
  }

  purchaseUpgrade(id) {
    const options = this.getUpgradeOptions();
    const upgrade = options.find((u) => u.id === id);
    if (!upgrade) return;

    if (upgrade.level >= upgrade.maxLevel) {
      this.shopUi.notice = `${upgrade.title} is already maxed.`;
      return;
    }
    if (this.state.coins < upgrade.cost) {
      this.shopUi.notice = `Need ${upgrade.cost} coins for ${upgrade.title}.`;
      return;
    }

    this.state.coins -= upgrade.cost;
    if (id === "multi") this.playerWeapon.multiLevel += 1;
    if (id === "speed") this.playerWeapon.speedLevel += 1;
    if (id === "backfire") this.playerWeapon.backfireLevel += 1;
    this.shopUi.notice = `${upgrade.title} upgraded to Lv ${upgrade.level + 1}.`;
  }

  buildQuestContext() {
    const player = { level: this.player.level };
    const playerTransform = this.world.c.Transform.get(this.playerId);
    const enemyTypes = new Set();

    for (const enemyId of this.world.view("Enemy", "Transform")) {
      const et = this.world.c.Transform.get(enemyId);
      const enemy = this.world.c.Enemy.get(enemyId);
      if (!et || !playerTransform) continue;

      const dx = et.x - playerTransform.x;
      const dy = et.y - playerTransform.y;
      if (len(dx, dy) > 16) continue;

      enemyTypes.add(enemy?.type ?? "unknown");
    }

    const nearbyEnemies = Array.from(enemyTypes).map((type) => ({
      id: `enemy_${type}`,
      name: `${type[0]?.toUpperCase() ?? ""}${type.slice(1)} Enemy`,
    }));
    if (nearbyEnemies.length === 0) {
      nearbyEnemies.push({ id: "enemy_swirler", name: "Swirler Enemy" });
    }

    return {
      npcId: this.worldData.npcId,
      regionId: this.worldData.regionId,
      playerLevel: player.level,
      questFocus: "combat",
      nearbyEnemies,
      nearbyItems: this.worldData.nearbyItems,
      nearbyAreas: this.worldData.nearbyAreas,
    };
  }

  async requestQuest() {
    if (this.questRequestInFlight) return;

    this.questRequestInFlight = true;
    this.state.questStatus = "Fetching quest...";
    try {
      const context = this.buildQuestContext();
      context.requestId = this.questRequestId++;
      const brokerQuest = await this.questBroker.getQuest(context);
      const quest = this.ensureCombatQuest(brokerQuest, context);
      this.state.activeQuest = quest;
      this.state.questProgress = 0;
      this.state.questDialog = quest?.dialog?.offer?.length
        ? quest.dialog.offer
        : ["The blacksmith has work for you."];

      this.state.questLog = [
        quest,
        ...this.state.questLog.filter((q) => q.id !== quest.id),
      ].slice(0, 5);

      this.state.questStatus = `Active: ${quest.title}`;
    } catch (err) {
      this.state.questDialog = ["Could not fetch quest right now."];
      this.state.questStatus = "Quest broker unavailable";
      console.warn("Quest request failed:", err);
    } finally {
      this.questRequestInFlight = false;
    }
  }

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

  setAnimation(id, anim) {
    const r = this.world.c.Render.get(id);
    if (!r) return;
    r.anim = { ...anim };
    r.animTime = 0;
    r.frame = r.anim.start ?? 0;
  }

  hitsObstacle(moverId, x, y, radius, obstacleIds) {
    for (const oid of obstacleIds) {
      if (oid === moverId) continue;
      const ot = this.world.c.Transform.get(oid);
      const oc = this.world.c.Collider.get(oid);
      if (!ot || !oc) continue;
      if (circleHit({ x, y }, radius, ot, oc.r)) return true;
    }
    return false;
  }

  spawnObstacles() {
    const ring = [
      [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
      [-6, -4], [-6, -3], [-6, -2], [-5, -2], [-4, -2],
      [5, -5], [5, -4], [5, -3], [6, -4],
      [2, 6], [3, 6], [4, 6], [5, 6],
      [-3, 8], [-2, 8], [-1, 8],
    ];
    for (const [x, y] of ring) {
      this.spawnObstacleEntity(x, y);
    }
  }

  spawnObstacleEntity(x, y) {
    const o = this.world.create();
    this.world.c.Obstacle.set(o, { type: "rock" });
    this.world.c.Transform.set(o, { x, y, z: 0 });
    this.world.c.Collider.set(o, { r: 0.62 });
    this.world.c.Render.set(o, {
      kind: "diamond",
      size: 1.1,
      bob: 0.0,
      hue: 30,
    });
  }

  spawnBullet(x, y, dx, dy, faction, radius, damage, speedOverride = null) {
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
    const speed = speedOverride ?? (faction === "player" ? 12 : 8);
    this.world.c.Velocity.set(b, { x: dx * speed, y: dy * speed });
    this.world.c.Collider.set(b, { r: radius });
    this.world.c.Bullet.set(b, { damage, faction, life: 2.2 });
  }

  spawnEnemy() {
    const e = this.world.create();
    const side = Math.random() < 0.5 ? -1 : 1;
    let ex = rand(this.bounds.minX, this.bounds.maxX);
    let ey = side < 0 ? this.bounds.minY - 2 : this.bounds.maxY + 2;
    const obstacles = this.world.view("Obstacle", "Transform", "Collider");

    for (let i = 0; i < 16; i++) {
      if (!this.hitsObstacle(e, ex, ey, 0.42, obstacles)) break;
      ex = rand(this.bounds.minX, this.bounds.maxX);
      ey = side < 0 ? this.bounds.minY - 2 : this.bounds.maxY + 2;
    }

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
    const enemyHp = this.enemyHealthValue();
    this.world.c.Health.set(e, { hp: enemyHp, max: enemyHp });
    this.world.c.Shooter.set(e, { cool: rand(0.1, 0.6), rate: rand(0.8, 1.4), speed: 8, faction: "enemy" });
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // World pass: background, grid, sorted renderables, then HUD.
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, w, h);

    if (this.state.inStartArea) {
      this.drawStartArea();
      return;
    }

    if (this.state.inShop) {
      this.drawShop();
      return;
    }

    this.drawGrid(14);

    const ids = this.world.view("Transform", "Render");
    const list = this._renderList;
    list.length = 0;
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      const tr = this.world.c.Transform.get(id);
      const r = this.world.c.Render.get(id);

      if (r.bob > 0) r.bob = Math.max(0, r.bob - 0.02);

      const s = worldToScreen(
        { x: tr.x, y: tr.y, z: tr.z + r.bob },
        this.camera,
        w,
        h,
        this.tileW,
        this.tileH,
        this.zScale
      );
      list.push({ id, s, r });
    }

    list.sort((a, b) => a.s.y - b.s.y);

    for (const it of list) {
      this.drawEntity(it);
    }

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

  isInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  drawStartArea() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1a2835");
    g.addColorStop(1, "#0b1017");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#d7e6f2";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.floor(h * 0.075)}px system-ui, sans-serif`;
    ctx.fillText("Blacksmith Camp", w * 0.5, h * 0.3);
    ctx.font = `500 ${Math.floor(h * 0.03)}px system-ui, sans-serif`;
    ctx.fillText("Collect bounty quests and hunt enemy waves.", w * 0.5, h * 0.38);
    ctx.fillText("Quest focus: defeat enemies and report kills.", w * 0.5, h * 0.43);

    const bw = Math.min(280, Math.max(180, w * 0.28));
    const bh = Math.min(64, Math.max(44, h * 0.09));
    const bx = w * 0.5 - bw * 0.5;
    const by = h * 0.56;
    this.startButtonRect = { x: bx, y: by, w: bw, h: bh };

    const hover = this.isInRect(this.input.mouse.x, this.input.mouse.y, this.startButtonRect);
    ctx.fillStyle = hover ? "#f8c14f" : "#e0a832";
    ctx.strokeStyle = "#5a4215";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1d1200";
    ctx.font = `bold ${Math.floor(bh * 0.38)}px system-ui, sans-serif`;
    ctx.fillText("Enter Game", w * 0.5, by + bh * 0.62);
  }

  drawShop() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#151e2d");
    g.addColorStop(1, "#0b1017");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const panelW = Math.min(840, Math.max(360, w * 0.88));
    const panelH = Math.min(560, Math.max(360, h * 0.82));
    const px = w * 0.5 - panelW * 0.5;
    const py = h * 0.5 - panelH * 0.5;

    ctx.fillStyle = "rgba(6,10,16,0.72)";
    ctx.strokeStyle = "rgba(126,173,222,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#e4eef8";
    ctx.font = `bold ${Math.floor(panelH * 0.08)}px system-ui, sans-serif`;
    ctx.fillText("Armory Shop", px + 24, py + 54);

    ctx.font = `${Math.floor(panelH * 0.038)}px system-ui, sans-serif`;
    ctx.fillStyle = "#9dc8ee";
    ctx.fillText(`Coins: ${this.state.coins}`, px + 24, py + 86);

    const upgrades = this.getUpgradeOptions();
    const top = py + 110;
    const rowH = Math.floor(panelH * 0.19);
    this.shopUi.upgradeButtons = {};

    for (let i = 0; i < upgrades.length; i += 1) {
      const up = upgrades[i];
      const ux = px + 20;
      const uy = top + i * (rowH + 14);
      const uw = panelW - 40;
      const uh = rowH;
      const maxed = up.level >= up.maxLevel;
      const canAfford = this.state.coins >= up.cost;
      const hover = this.isInRect(this.input.mouse.x, this.input.mouse.y, { x: ux, y: uy, w: uw, h: uh });

      this.shopUi.upgradeButtons[up.id] = { x: ux, y: uy, w: uw, h: uh };

      ctx.fillStyle = maxed ? "rgba(66, 82, 99, 0.78)" : (hover ? "rgba(50, 88, 120, 0.78)" : "rgba(35, 59, 82, 0.72)");
      ctx.strokeStyle = canAfford || maxed ? "rgba(145, 201, 246, 0.55)" : "rgba(148, 93, 93, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ux, uy, uw, uh, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#eff7ff";
      ctx.font = `bold ${Math.floor(uh * 0.24)}px system-ui, sans-serif`;
      const costLabel = maxed ? "MAX" : `${up.cost} coins`;
      ctx.fillText(`${up.title}  Lv ${up.level}/${up.maxLevel}`, ux + 16, uy + Math.floor(uh * 0.35));
      ctx.font = `${Math.floor(uh * 0.2)}px system-ui, sans-serif`;
      ctx.fillStyle = "#bfdbf4";
      ctx.fillText(up.desc, ux + 16, uy + Math.floor(uh * 0.62));
      ctx.fillStyle = canAfford || maxed ? "#ffe39f" : "#ffb2b2";
      ctx.fillText(costLabel, ux + 16, uy + Math.floor(uh * 0.84));
    }

    const cbw = Math.min(280, panelW * 0.44);
    const cbh = Math.min(66, panelH * 0.13);
    const cbx = px + panelW - cbw - 20;
    const cby = py + panelH - cbh - 16;
    this.shopUi.continueButton = { x: cbx, y: cby, w: cbw, h: cbh };

    const cHover = this.isInRect(this.input.mouse.x, this.input.mouse.y, this.shopUi.continueButton);
    ctx.fillStyle = cHover ? "#ffd466" : "#e7b94f";
    ctx.strokeStyle = "#5a4215";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cbx, cby, cbw, cbh, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#201406";
    ctx.font = `bold ${Math.floor(cbh * 0.42)}px system-ui, sans-serif`;
    ctx.fillText("Continue", cbx + cbw * 0.28, cby + cbh * 0.62);

    if (this.shopUi.notice) {
      ctx.fillStyle = "#d8ebff";
      ctx.font = `${Math.floor(panelH * 0.038)}px system-ui, sans-serif`;
      ctx.fillText(this.shopUi.notice, px + 24, py + panelH - 26);
    }
  }

  drawGrid(radius) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const halfW = this.tileW * 0.5;
    const halfH = this.tileH * 0.5;
    const ox = w * 0.5 - (this.camera.x - this.camera.y) * halfW;
    const oy = h * 0.5 - (this.camera.x + this.camera.y) * halfH;
    ctx.globalAlpha = 0.18;

    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const sx = (x - y) * halfW + ox;
        const sy = (x + y) * halfH + oy;
        const odd = (x + y) & 1;
        ctx.strokeStyle = odd ? "#2a3644" : "#24303d";
        drawDiamond(ctx, sx, sy, halfW, halfH);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  drawEntity({ id, s, r }) {
    const ctx = this.ctx;

    // Sprite path first; fall back to procedural shapes when assets are unavailable.
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
        const ax = r.anchor?.x ?? 0.5;
        const ay = r.anchor?.y ?? 1.0;

        const sizePx = r.size * this.tileH;
        const scale = r.pixelScale ?? (sizePx / Math.max(img.width, img.height));

        const dw = img.width * scale;
        const dh = img.height * scale;

        const dx = s.x - dw * ax;
        const dy = s.y - dh * ay;

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, dx, dy, dw, dh);

        this.drawHealthBar(id, s, sizePx);
        return;
      }
    }

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

  drawUI() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const pHealth = this.world.c.Health.get(this.playerId);
    const hp = Math.max(0, pHealth.hp);

    const margin = 10;
    const pad = 10;
    const panelW = Math.max(0, Math.min(560, w - margin * 2));
    const fontSize = Math.max(12, Math.min(16, Math.floor(h * 0.022)));
    const lineH = fontSize + 6;
    const panelHTarget = pad * 2 + lineH * 10;
    const panelH = Math.max(0, Math.min(panelHTarget, h - margin * 2));
    const panelX = margin;
    const panelY = margin;
    const leftX = panelX + pad;
    const colSplit = panelX + Math.floor(panelW * 0.62);
    const rightX = colSplit + 10;
    const leftMaxW = Math.max(0, colSplit - leftX - 6);
    const rightMaxW = Math.max(0, panelX + panelW - pad - rightX);

    const fitText = (text, maxW) => {
      const raw = String(text ?? "");
      if (maxW <= 0) return "";
      if (ctx.measureText(raw).width <= maxW) return raw;
      let out = raw;
      while (out.length > 1 && ctx.measureText(`${out}...`).width > maxW) {
        out = out.slice(0, -1);
      }
      return `${out}...`;
    };

    let row = panelY + pad + fontSize;
    const drawRow = (text, x, maxW) => {
      if (row > panelY + panelH - pad) return false;
      ctx.fillText(fitText(text, maxW), x, row);
      row += lineH;
      return true;
    };

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = "#e8eef5";
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    drawRow(`HP: ${hp}/${pHealth.max}`, leftX, leftMaxW);
    drawRow(`Score: ${this.state.score}`, leftX, leftMaxW);
    drawRow(`Coins: ${this.state.coins}`, leftX, leftMaxW);
    drawRow(
      `Level: ${this.player.level} (${this.player.points}/${this.player.pointsToNextLevel})`,
      leftX,
      leftMaxW
    );
    drawRow(this.state.questStatus, leftX, leftMaxW);
    drawRow(this.state.activeQuest ? `Quest: ${this.state.activeQuest.title}` : "Quest: None", leftX, leftMaxW);
    if (this.state.activeQuest) {
      const qCount = this.state.activeQuest.objective?.count ?? 1;
      ctx.fillText(fitText(`Kills: ${this.state.questProgress}/${qCount}`, rightMaxW), rightX, panelY + pad + fontSize + lineH * 5);
    }
    drawRow(`NPC says: ${this.state.questDialog[0] ?? "-"}`, leftX, leftMaxW);
    drawRow(`Quest Log: ${this.state.questLog.length}`, leftX, leftMaxW);
    const recentQuestTitles = this.state.questLog.slice(0, 2).map((q) => q.title).join(" | ");
    drawRow(`Recent: ${recentQuestTitles || "-"}`, leftX, leftMaxW);
    ctx.fillText(fitText("Press Q to get a quest", rightMaxW), rightX, panelY + panelH - pad);

    if (this.state.levelUpFlash > 0) {
      ctx.fillStyle = "rgba(255, 225, 110, 0.95)";
      ctx.font = `bold ${fontSize + 4}px system-ui, sans-serif`;
      ctx.fillText(
        fitText(`LEVEL UP! ${this.player.level}`, rightMaxW),
        rightX,
        panelY + pad + fontSize
      );
      ctx.fillStyle = "#e8eef5";
      ctx.font = `${fontSize}px system-ui, sans-serif`;
    }

    if (this.state.questCompletedNotice > 0) {
      ctx.fillStyle = "rgba(125, 232, 159, 0.96)";
      ctx.font = `bold ${fontSize + 2}px system-ui, sans-serif`;
      ctx.fillText(fitText("QUEST COMPLETE", rightMaxW), rightX, panelY + pad + fontSize + lineH);
      ctx.fillStyle = "#e8eef5";
      ctx.font = `${fontSize}px system-ui, sans-serif`;
    }

    ctx.textAlign = "right";
    ctx.fillText(`${this.fps} fps`, w - 14, 26);
    ctx.restore();
  }
}
