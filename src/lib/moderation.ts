// Basic content moderation: refuse hateful / sexual / harassing content.
// Runs server-side on AI caption, translation, and chat inputs.

const BLOCKED = [
  "kill yourself",
  "kys",
  "hate you",
  "i hate ",
  "retard",
  "chink",
  "nigger",
  "nigga",
  "faggot",
  "tranny",
  "porn",
  "xxx",
  "hentai",
  "nude",
  "naked",
  "sex with",
  "rape",
  "molest",
  "terrorist attack",
  "bomb how",
  "school shooting",
  "self harm",
  "cut myself",
];

export function moderate(text: string): { ok: boolean; reason?: string } {
  const lower = (text || "").toLowerCase();
  for (const bad of BLOCKED) {
    if (lower.includes(bad)) {
      return {
        ok: false,
        reason:
          "That request looks hateful, sexual, harassing, or unsafe — I can't help with that. Try a fun, friendly topic instead. 💚",
      };
    }
  }
  // crude caps-scream / spam check
  if (text.length > 20 && text === text.toUpperCase() && /[A-Z]{15,}/.test(text)) {
    // allow — meme text is often caps, so don't block
  }
  return { ok: true };
}
