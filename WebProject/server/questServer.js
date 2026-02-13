// server/questServer.js
// Minimal quest API server.
// Default: local generator (no LLM).
// Optional: if USE_OLLAMA=1, will call Ollama at OLLAMA_URL with OLLAMA_MODEL.

import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.QUEST_SERVER_PORT ? Number(process.env.QUEST_SERVER_PORT) : 5175;

// ---------- helpers ----------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hashStringToInt(str) {
  // Simple deterministic hash
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// ---------- local generator (AI-lite) ----------
function generateQuestLocal(payload) {
  const {
    npcId = "npc_unknown",
    regionId = "region_unknown",
    playerLevel = 1,
    requestId = 0,
    questFocus = "",
    // These lists should be passed from client based on YOUR game data:
    nearbyEnemies = [],
    nearbyItems = [],
    nearbyAreas = [],
  } = payload ?? {};

  // Stable seed: same NPC+region+levelBucket -> same quest (good for caching/demos)
  const levelBucket = Math.floor((Number(playerLevel) || 1) / 2); // groups of 2
  const seed = hashStringToInt(`${npcId}|${regionId}|${levelBucket}|${requestId}`);
  const rng = mulberry32(seed);

  const allowedTypes = ["fetch", "defeat", "explore", "deliver"];

  // Choose type based on what data you actually have
  let type = pick(rng, allowedTypes);
  if (questFocus === "combat") type = "defeat";
  if (type === "fetch" && nearbyItems.length === 0) type = "explore";
  if (type === "defeat" && nearbyEnemies.length === 0) type = "explore";
  if (type === "deliver" && nearbyItems.length === 0) type = "explore";
  if (type === "explore" && nearbyAreas.length === 0) type = "fetch";

  const lvl = clamp(Number(playerLevel) || 1, 1, 99);
  const count = clamp(1 + Math.floor(lvl / 3), 1, 6);
  const gold = clamp(10 + lvl * 3 + Math.floor(rng() * 10), 10, 250);
  const xp = clamp(25 + lvl * 8 + Math.floor(rng() * 20), 25, 900);

  const questId = `q_${npcId}_${regionId}_${levelBucket}_${requestId}`;

  const npcName = npcId.replace(/^npc_/, "").replaceAll("_", " ");
  const regionName = regionId.replace(/^region_/, "").replaceAll("_", " ");

  // Pick targets from provided lists
  const enemy = nearbyEnemies.length ? pick(rng, nearbyEnemies) : null;
  const item = nearbyItems.length ? pick(rng, nearbyItems) : null;
  const area = nearbyAreas.length ? pick(rng, nearbyAreas) : null;

  let title = "A Small Favor";
  let objective = { targetId: "unknown", count: 1 };
  let dialogOffer = [];
  let dialogAccept = [];
  let dialogComplete = [];

  if (type === "fetch") {
    title = `Supplies for ${npcName}`;
    objective = { targetId: item?.id ?? "item_unknown", count: clamp(Math.floor(count / 2) + 1, 1, 4) };
    dialogOffer = [
      `Hey—got a minute? I’m short on materials.`,
      `Bring me ${objective.count}x ${item?.name ?? "something useful"} from around ${regionName}.`,
    ];
    dialogAccept = [`Good. Don’t take all day.`];
    dialogComplete = [`Nice work. This will keep me going.`];
  } else if (type === "defeat") {
    title = `Bounty: Clear the Threat`;
    objective = { targetId: enemy?.id ?? "enemy_unknown", count: clamp(count + 1, 2, 8) };
    dialogOffer = [
      `A wave of enemies is pushing into ${regionName}.`,
      `Take out ${objective.count}x ${enemy?.name ?? "hostiles"} and claim your bounty.`,
    ];
    dialogAccept = [`Make every shot count.`];
    dialogComplete = [`Good hunting. Here’s your payout.`];
  } else if (type === "deliver") {
    title = `Special Delivery`;
    objective = { targetId: item?.id ?? "item_unknown", count: 1 };
    dialogOffer = [
      `I need this delivered—quietly.`,
      `Take ${item?.name ?? "this package"} to the next safe spot in ${regionName}.`,
    ];
    dialogAccept = [`If anyone asks, you don’t know me.`];
    dialogComplete = [`Perfect. No one followed you, right?`];
  } else {
    title = `Scout ${regionName}`;
    objective = { targetId: area?.id ?? "area_unknown", count: 1 };
    dialogOffer = [
      `I need eyes on the area.`,
      `Go check ${area?.name ?? "a nearby location"} and come back with anything unusual.`,
    ];
    dialogAccept = [`Keep it quick. In and out.`];
    dialogComplete = [`Good intel. That helps more than you think.`];
  }

  return {
    id: questId,
    npcId,
    title,
    type,
    objective,
    reward: { xp, gold, itemId: null },
    dialog: { offer: dialogOffer, accept: dialogAccept, complete: dialogComplete },
  };
}

// ---------- optional Ollama ----------
async function generateQuestWithOllama(payload) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b"; // replace later
  const level = Number(payload?.playerLevel) || 1;

  //short prompt, strict JSON, and we validate on the client.
  const prompt = `
Return ONLY valid JSON (no markdown) with this schema:
{
  "id": "string",
  "npcId": "${payload?.npcId ?? "npc_unknown"}",
  "title": "string",
  "type": "fetch|defeat|explore|deliver",
  "objective": { "targetId": "string", "count": number },
  "reward": { "xp": number, "gold": number, "itemId": null },
  "dialog": { "offer": [string], "accept": [string], "complete": [string] }
}

Rules:
- Use ONLY targetId values from these lists (do not invent IDs):
nearbyEnemies=${JSON.stringify(payload?.nearbyEnemies ?? [])}
nearbyItems=${JSON.stringify(payload?.nearbyItems ?? [])}
nearbyAreas=${JSON.stringify(payload?.nearbyAreas ?? [])}
- Keep dialog PG, short (2 lines offer, 1 accept, 1 complete).
- playerLevel=${level}; scale rewards moderately.
`;

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.4 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();

  // Ollama returns text in data.response
  const text = String(data?.response ?? "").trim();
  return JSON.parse(text);
}

// ---------- API ----------
app.post("/api/quest", async (req, res) => {
  try {
    const payload = req.body ?? {};

    const useOllama = process.env.USE_OLLAMA === "1";
    const quest = useOllama
      ? await generateQuestWithOllama(payload)
      : generateQuestLocal(payload);

    res.json({ ok: true, quest });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message ?? err) });
  }
});

app.listen(PORT, () => {
  console.log(`[questServer] listening on http://localhost:${PORT}`);
  console.log(`[questServer] USE_OLLAMA=${process.env.USE_OLLAMA || "0"}`);
});
