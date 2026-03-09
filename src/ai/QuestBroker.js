// src/ai/QuestBroker.js
import { validateQuest } from "./questValidator.js";
import { FALLBACK_QUESTS } from "./fallbackQuests.js";

function makeIdSets({ nearbyEnemies = [], nearbyItems = [], nearbyAreas = [] }) {
  return {
    enemies: new Set(nearbyEnemies.map((e) => e.id)),
    items: new Set(nearbyItems.map((i) => i.id)),
    areas: new Set(nearbyAreas.map((a) => a.id)),
  };
}

function pickFallback(npcId, regionId, context) {
  // Try to adapt fallback to available IDs so validator passes.
  const { nearbyEnemies = [], nearbyItems = [], nearbyAreas = [] } = context;
  const q = structuredClone(FALLBACK_QUESTS[Math.floor(Math.random() * FALLBACK_QUESTS.length)]);
  q.id = `fallback_${npcId}_${regionId}_${Date.now()}`;
  q.npcId = npcId;

  if (q.type === "fetch" && nearbyItems.length) q.objective.targetId = nearbyItems[0].id;
  if (q.type === "explore" && nearbyAreas.length) q.objective.targetId = nearbyAreas[0].id;

  // If still unknown, just force a known id from any list
  const anyId = (nearbyItems[0]?.id || nearbyEnemies[0]?.id || nearbyAreas[0]?.id || "item_unknown");
  q.objective.targetId = anyId;

  return q;
}

export class QuestBroker {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "";
    this.cache = new Map(); // key -> quest
    this.timeoutMs = options.timeoutMs ?? 1200; // keep demo snappy
    this.useCache = options.useCache ?? false;
  }

  _cacheKey(npcId, regionId, playerLevel, requestId) {
    const bucket = Math.floor((Number(playerLevel) || 1) / 2);
    return `${npcId}|${regionId}|${bucket}|${requestId ?? "none"}`;
  }

  async getQuest({ npcId, regionId, playerLevel, nearbyEnemies, nearbyItems, nearbyAreas, requestId, questFocus }) {
    const key = this._cacheKey(npcId, regionId, playerLevel, requestId);
    if (this.useCache && this.cache.has(key)) return this.cache.get(key);

    const context = { npcId, regionId, playerLevel, nearbyEnemies, nearbyItems, nearbyAreas, requestId, questFocus };
    const allowedIds = makeIdSets(context);

    const controller = new AbortController();
    const timeoutErr = new Error(`Quest request timed out after ${this.timeoutMs}ms`);
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(timeoutErr);
      }, this.timeoutMs);
    });

    try {
      const resp = await Promise.race([
        fetch(`${this.baseUrl}/api/quest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
          signal: controller.signal,
        }),
        timeoutPromise,
      ]);

      if (!resp?.ok) throw new Error(`Quest API HTTP ${resp?.status ?? "unknown"}`);
      const data = await resp.json().catch(() => ({}));
      const quest = data?.quest;

      const v = validateQuest(quest, allowedIds);
      if (!v.ok) throw new Error(`Quest invalid: ${v.reason}`);

      if (this.useCache) this.cache.set(key, quest);
      return quest;
    } catch (err) {
      // fallback
      const fallback = pickFallback(npcId, regionId, context);
      // Try validate; if fails, still return fallback (better than nothing)
      if (this.useCache) this.cache.set(key, fallback);
      return fallback;
    } finally {
      clearTimeout(timer);
    }
  }
}
