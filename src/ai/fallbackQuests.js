// src/ai/fallbackQuests.js

export const FALLBACK_QUESTS = [
  {
    id: "fallback_fetch_1",
    npcId: "npc_unknown",
    title: "Gather Supplies",
    type: "fetch",
    objective: { targetId: "item_unknown", count: 2 },
    reward: { xp: 60, gold: 20, itemId: null },
    dialog: {
      offer: ["Could you help me restock?", "Bring me 2 useful items from nearby."],
      accept: ["Thanks. I’ll be here."],
      complete: ["Perfect. That’ll do."],
    },
  },
  {
    id: "fallback_explore_1",
    npcId: "npc_unknown",
    title: "Quick Scout",
    type: "explore",
    objective: { targetId: "area_unknown", count: 1 },
    reward: { xp: 50, gold: 15, itemId: null },
    dialog: {
      offer: ["I need a quick look around.", "Check a nearby area and return."],
      accept: ["Don’t get distracted."],
      complete: ["Good. That’s what I needed."],
    },
  },
];
