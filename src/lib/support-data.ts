// FAQ + chatbot knowledge base for Help & Customer Service.

export interface Faq {
  id: string;
  category: string;
  q: string;
  a: string;
}

export const FAQ_CATEGORIES = ["All", "Getting started", "Memes", "Battles", "Brands", "Translator", "Account"];

export const FAQS: Faq[] = [
  {
    id: "start-1",
    category: "Getting started",
    q: "What is MemeArena?",
    a: "MemeArena is a platform for memers to create, post, compete and work with brands. Post memes to the feed, enter cash-prize battles, pitch brand briefs — and now you can also translate memes into 30 languages, get AI caption ideas, and chat with support.",
  },
  {
    id: "start-2",
    category: "Getting started",
    q: "Do I need an account to use the tools?",
    a: "You can browse the feed, use the AI Translator, and try the AI Meme Maker without an account. To post memes, vote, enter battles, or pitch brands, pick a persona (or create your own memer) from the avatar menu in the header.",
  },
  {
    id: "start-3",
    category: "Getting started",
    q: "Is MemeArena free?",
    a: "Yes — posting, voting, battles, the translator, and the AI Meme Maker are all free. Brands pay memers for sponsored memes, and battle winners get real cash prizes.",
  },
  {
    id: "memes-1",
    category: "Memes",
    q: "How do I create a meme?",
    a: "Go to Studio (or the new AI Meme Maker at /memes). Pick a template or upload your own image, add top/bottom text, tags, and hit Post. You earn +50 XP per post.",
  },
  {
    id: "memes-2",
    category: "Memes",
    q: "How does the AI Meme Maker work?",
    a: "Type an idea like 'monday meetings' into the AI box and it suggests 5 funny caption options plus a recommended template. Then fine-tune in the canvas editor: fonts, sizes, colors, outlines, drag-to-move text, stickers — and download as PNG or post straight to the feed.",
  },
  {
    id: "memes-3",
    category: "Memes",
    q: "How do votes and XP work?",
    a: "+50 XP per meme, +75 per battle entry, +5 per upvote received, +10 per comment, +20 per brand pitch, +300 per deal won. Every 1000 XP you level up. Hot ranking mixes score with freshness.",
  },
  {
    id: "battles-1",
    category: "Battles",
    q: "How do battles work?",
    a: "Each battle has a theme, rules, deadline, and prize. Enter with an existing meme or quick-create one. The community votes — highest score at the deadline wins. Winners get cash, badges, and clout.",
  },
  {
    id: "battles-2",
    category: "Battles",
    q: "Can I host my own battle?",
    a: "Yes! Hit 'Host a battle' on the Battles page, set a title, theme, and prize. Brands often sponsor battles to discover memers to hire.",
  },
  {
    id: "brands-1",
    category: "Brands",
    q: "How do brand deals work?",
    a: "Brands post briefs with budgets (e.g. $500–$2,500). Memers pitch with their angle and portfolio. Brands review pitches and hire — accepted memers earn +300 XP plus the bag. Average response is under 48 hours.",
  },
  {
    id: "brands-2",
    category: "Brands",
    q: "I'm a brand. How do I post a brief?",
    a: "Switch to a brand persona in the header, go to Brands, and click 'Post a brief'. Describe the vibe, deliverables, budget range, and deadline. Pitches will roll in automatically.",
  },
  {
    id: "trans-1",
    category: "Translator",
    q: "Which languages does the translator support?",
    a: "30 languages including English, Hindi, Telugu, Tamil, Spanish, French, German, Arabic, Japanese, Chinese, Korean, Portuguese, Russian, and more. Source supports auto-detect.",
  },
  {
    id: "trans-2",
    category: "Translator",
    q: "Can I translate a meme caption?",
    a: "Absolutely — paste any caption into the translator, pick formal or casual tone, and use text-to-speech to hear it. Your recent translations are saved on your device.",
  },
  {
    id: "acct-1",
    category: "Account",
    q: "How do I switch personas?",
    a: "Click your avatar in the header to switch between demo memers and brands, or create your own memer with a custom handle. Your choice is remembered on your device.",
  },
  {
    id: "acct-2",
    category: "Account",
    q: "How do I contact support?",
    a: "Use the chatbot on the Help page for instant answers, or fill in the contact form to open a support ticket. Pick 'Talk to a human' any time and we'll show the form directly.",
  },
];

// Keyword → answer matching for the built-in support bot.
export interface BotRule {
  keys: string[];
  answer: string;
}

export const BOT_RULES: BotRule[] = [
  {
    keys: ["translate", "language", "hindi", "telugu", "tamil", "spanish", "translat"],
    answer:
      "🌍 The AI Translator (/translate) supports 30 languages with auto-detect, formal/casual tone, text-to-speech, and history saved on your device. Paste any meme caption and pick your target language!",
  },
  {
    keys: ["ai meme", "caption idea", "generate caption", "meme maker", "canvas", "sticker"],
    answer:
      "🤖 The AI Meme Maker (/memes) is our built-in AI: type any idea and it suggests 5 funny captions + a template. Then edit on canvas — fonts, colors, outlines, drag text, stickers — and Download PNG or post to the feed.",
  },
  {
    keys: ["battle", "compete", "prize", "win", "contest", "challenge"],
    answer:
      "⚔️ Battles (/battles) are themed meme competitions with cash prizes. Enter with an existing meme or quick-create one, get community votes, and the top score at the deadline wins. Hosting your own battle is free!",
  },
  {
    keys: ["brand", "deal", "sponsor", "pitch", "brief", "paid", "money", "earn"],
    answer:
      "💰 Brands post briefs with budgets on /brands. Pitch with your angle + portfolio, and if you're hired you get +300 XP and real money. Brands: click 'Post a brief' to hire memers.",
  },
  {
    keys: ["post", "upload", "create meme", "studio", "template"],
    answer:
      "🎨 To post: open Studio (/create), pick one of 14 templates or paste your own image URL, write top/bottom text, add tags, and hit Post (+50 XP). You can also enter a live battle in the same step (+75 XP).",
  },
  {
    keys: ["vote", "xp", "level", "rank", "leaderboard", "score"],
    answer:
      "⚡ XP: +50/post, +75/battle entry, +5/upvote received, +10/comment, +20/pitch, +300/deal won. Level up every 1000 XP. Rankings live at /leaderboard with a season podium.",
  },
  {
    keys: ["account", "login", "persona", "switch", "handle", "profile"],
    answer:
      "👤 Click your avatar (top-right) to switch demo personas or create your own memer. Your profile at /u/yourhandle shows memes, XP, achievements, and brand history.",
  },
  {
    keys: ["human", "ticket", "contact", "email", "support", "help", "problem", "bug", "report"],
    answer:
      "🎧 You can open a support ticket with the contact form below — tell us your name, email, issue type, and message, and the team replies within 24h. Describe your issue here too and I'll try to help instantly!",
  },
  {
    keys: ["free", "cost", "price", "pay"],
    answer:
      "🆓 Everything for memers is free: posting, voting, battles, translator, and AI Meme Maker. Brands pay memers — never the other way around.",
  },
  {
    keys: ["hello", "hi", "hey", "namaste", "hola", "bonjour", "yo"],
    answer:
      "Hey! 👋 I'm ArenaBot, your MemeArena assistant. Ask me about posting memes, battles, brand deals, the translator, or the AI Meme Maker — or type 'human' to contact support.",
  },
];

export const BOT_FALLBACK =
  "Good question! 🤔 I can help with: posting memes 🎨, AI captions 🤖, battles ⚔️, brand deals 💰, translator 🌍, XP/ranks ⚡, and accounts 👤. What are you trying to do? (Or type 'human' to open a support ticket.)";

export function answerQuestion(message: string): string {
  const lower = message.toLowerCase();
  let best: BotRule | null = null;
  let bestHits = 0;
  for (const rule of BOT_RULES) {
    let hits = 0;
    for (const k of rule.keys) if (lower.includes(k)) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      best = rule;
    }
  }
  return best ? best.answer : BOT_FALLBACK;
}
