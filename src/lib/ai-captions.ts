// Built-in "AI" caption engine: deterministic, funny, template-aware.
// Generates 5 caption options + a recommended template for any idea/topic.
// No external API key needed — runs server-side in /api/ai/captions.

import { MEME_TEMPLATES } from "./templates";

export interface CaptionIdea {
  top: string;
  bottom: string;
  templateId: string;
  templateName: string;
  vibe: string;
}

const STOP = new Set([
  "the", "a", "an", "my", "our", "your", "with", "about", "into", "that",
  "this", "and", "for", "are", "was", "were", "when", "meme", "memes", "funny",
]);

function keywords(idea: string): string[] {
  return idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .slice(0, 3);
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}

function pickTemplate(topic: string, salt: number): (typeof MEME_TEMPLATES)[0] {
  const t = topic.toLowerCase();
  // topic-aware template matching
  if (/cat|kitten|meow|pet|kitty/.test(t)) {
    const cats = MEME_TEMPLATES.filter((m) => m.category === "Cats");
    return cats[salt % cats.length];
  }
  if (/work|boss|meeting|job|office|standup|client|email|salary|interview/.test(t)) {
    const work = MEME_TEMPLATES.filter((m) => m.category === "Work");
    return work[salt % work.length];
  }
  if (/brand|ad|sponsor|money|deal|sale|market/.test(t)) {
    const b = MEME_TEMPLATES.filter((m) => m.category === "Brands");
    return b[salt % b.length];
  }
  const pool = MEME_TEMPLATES.filter((m) => m.category === "Reactions" || m.category === "Cats");
  return pool[(salt * 3 + topic.length) % pool.length];
}

export function generateCaptions(rawIdea: string): { ideas: CaptionIdea[]; recommendedTemplateId: string; topic: string } {
  const idea = rawIdea.trim().slice(0, 120) || "monday mornings";
  const topic = titleCase(idea);
  const UPPER = idea.toUpperCase();
  const keys = keywords(idea);
  const K = (keys[0] ?? "life").toUpperCase();
  const K2 = keys[1] ? keys[1].toUpperCase() : "EXPECTATIONS";

  const vibes = ["Relatable", "Unhinged", "Wholesome chaos", "Corporate pain", "3AM energy"];

  const pairs: Array<[string, string]> = [
    [`POV: ${UPPER}`, "NOBODY ASKED FOR THIS"],
    [`ME: I'LL DEAL WITH ${K} LATER`, `ALSO ME AT 3AM: ${K}??`],
    ["EXPECTATION", `${K2} (REALITY: ${K})`],
    [`NOBODY:`, `ME EXPLAINING ${K} TO MY THERAPIST:`],
    [`DAY 1 OF ${K}`, "DAY 47: SEND HELP"],
    [`BOSS: KEEP IT PROFESSIONAL`, `ME THINKING ABOUT ${K}:`],
    [`MY LAST BRAINCELL`, `WATCHING ME CHOOSE ${K}`],
    [`POV: YOU SAID "${UPPER}"`, "THE GROUP CHAT: 👀"],
  ];

  // deterministic shuffle by topic hash
  let hash = 0;
  for (const ch of idea) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const rotated = pairs.map((_, i) => pairs[(hash + i * 3) % pairs.length]);

  const ideas: CaptionIdea[] = rotated.slice(0, 5).map(([top, bottom], i) => {
    const tpl = pickTemplate(idea, hash + i);
    return { top, bottom, templateId: tpl.id, templateName: tpl.name, vibe: vibes[(hash + i) % vibes.length] };
  });

  return { ideas, recommendedTemplateId: ideas[0].templateId, topic };
}
