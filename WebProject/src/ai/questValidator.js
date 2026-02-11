// src/ai/questValidator.js

const ALLOWED_TYPES = new Set(["fetch", "defeat", "explore", "deliver"]);

export function validateQuest(quest, allowedIds = {}) {
  // allowedIds: { enemies:Set, items:Set, areas:Set }
  if (!quest || typeof quest !== "object") return { ok: false, reason: "quest not object" };

  const requiredStr = ["id", "npcId", "title", "type"];
  for (const k of requiredStr) {
    if (typeof quest[k] !== "string" || quest[k].trim() === "") return { ok: false, reason: `bad ${k}` };
  }
  if (!ALLOWED_TYPES.has(quest.type)) return { ok: false, reason: "bad type" };

  if (!quest.objective || typeof quest.objective !== "object") return { ok: false, reason: "missing objective" };
  if (typeof quest.objective.targetId !== "string" || quest.objective.targetId.trim() === "")
    return { ok: false, reason: "bad objective.targetId" };
  if (typeof quest.objective.count !== "number" || !Number.isFinite(quest.objective.count) || quest.objective.count < 1)
    return { ok: false, reason: "bad objective.count" };

  if (!quest.reward || typeof quest.reward !== "object") return { ok: false, reason: "missing reward" };
  if (typeof quest.reward.xp !== "number" || quest.reward.xp < 0) return { ok: false, reason: "bad reward.xp" };
  if (typeof quest.reward.gold !== "number" || quest.reward.gold < 0) return { ok: false, reason: "bad reward.gold" };

  if (!quest.dialog || typeof quest.dialog !== "object") return { ok: false, reason: "missing dialog" };
  for (const part of ["offer", "accept", "complete"]) {
    const arr = quest.dialog[part];
    if (!Array.isArray(arr) || arr.some((s) => typeof s !== "string")) return { ok: false, reason: `bad dialog.${part}` };
  }

  // ID gating: ensure AI didn't invent targets
  const tid = quest.objective.targetId;
  const { enemies, items, areas } = allowedIds;
  const isKnown =
    (enemies && enemies.has(tid)) ||
    (items && items.has(tid)) ||
    (areas && areas.has(tid));

  // If you want looser behavior, you can remove this check.
  if (!isKnown) return { ok: false, reason: `unknown targetId: ${tid}` };

  return { ok: true };
}
