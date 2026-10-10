import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, memes, votes, comments, challenges, challengeEntries, campaigns, applications } from "@/db/schema";
import { sql } from "drizzle-orm";
import { MEME_TEMPLATES } from "@/lib/templates";

export async function POST() {
  try {
    const existing = await db.execute(sql`SELECT COUNT(*) as c FROM users`);
    const count = Number((existing.rows[0] as { c: string }).c);
    if (count > 0) {
      return NextResponse.json({ ok: true, message: "already seeded", count });
    }

    // Users
    const seedUsers = [
      { handle: "danklord", displayName: "Dank Lord", avatarEmoji: "👑", avatarColor: "#a3e635", bio: "Professional shitposter. 400+ viral bangers. Brand-safe-ish.", role: "memer", xp: 4850, level: 5, followers: 128400, verified: true },
      { handle: "memequeen", displayName: "Meme Queen", avatarEmoji: "💅", avatarColor: "#e879f9", bio: "Your FYP's favorite menace. Relatable + unhinged.", role: "memer", xp: 3920, level: 4, followers: 96200, verified: true },
      { handle: "frogposter", displayName: "Frog Poster", avatarEmoji: "🐸", avatarColor: "#34d399", bio: "Certified frog meme historian. Touch grass? Never heard of her.", role: "memer", xp: 2870, level: 3, followers: 54300, verified: false },
      { handle: "corporatemillennial", displayName: "Corporate Millennial", avatarEmoji: "💼", avatarColor: "#22d3ee", bio: "Surviving standups one meme at a time. Open to brand deals.", role: "memer", xp: 2140, level: 3, followers: 32100, verified: false },
      { handle: "grannymemes", displayName: "Granny Memes", avatarEmoji: "👵", avatarColor: "#fbbf24", bio: "72 years young. Minion memes are my love language.", role: "memer", xp: 1680, level: 2, followers: 21800, verified: true },
      { handle: "midnightposter", displayName: "Midnight Poster", avatarEmoji: "🌙", avatarColor: "#818cf8", bio: "I only post at 3am. Cursed content enjoyer.", role: "memer", xp: 1240, level: 2, followers: 12400, verified: false },
      { handle: "duolingo", displayName: "Duolingo", avatarEmoji: "🦉", avatarColor: "#58cc02", bio: "The owl. You missed your Spanish lesson. We're watching.", role: "brand", xp: 5200, level: 6, followers: 890000, verified: true },
      { handle: "liquiddeath", displayName: "Liquid Death", avatarEmoji: "💀", avatarColor: "#e5e5e5", bio: "Murder your thirst. Unhinged marketing department.", role: "brand", xp: 4100, level: 5, followers: 450000, verified: true },
      { handle: "notion", displayName: "Notion", avatarEmoji: "📝", avatarColor: "#f5f5f5", bio: "Your second brain. Now accepting meme templates.", role: "brand", xp: 3300, level: 4, followers: 280000, verified: true },
      { handle: "chipotle", displayName: "Chipotle", avatarEmoji: "🌯", avatarColor: "#f97316", bio: "Extra guac is a lifestyle. Meme us your burrito order.", role: "brand", xp: 2900, level: 3, followers: 190000, verified: true },
    ];

    const createdUsers = await db.insert(users).values(seedUsers).returning();
    const byHandle: Record<string, (typeof createdUsers)[0]> = {};
    for (const u of createdUsers) byHandle[u.handle] = u;

    // Challenges
    const now = Date.now();
    const seedChallenges = [
      {
        title: "Monday Suffering Championship",
        description: "The most relatable Monday meme wins. Bonus points for existential dread. HR has been notified and they approve.",
        coverGradient: "from-lime-400 to-emerald-500",
        prize: "$2,000 + verified badge",
        prizePool: 2000,
        startsAt: new Date(now - 3 * 86400000),
        endsAt: new Date(now + 2 * 86400000),
        status: "live",
        rules: "1. Must be original\n2. No reposts from last week\n3. Keep it HR-friendly-ish\n4. One entry per memer",
        sponsorName: "Liquid Death",
        sponsorEmoji: "💀",
      },
      {
        title: "AI Took My Job (Meme It)",
        description: "AI is coming for us all. Best cope memes about robots, prompts and existential career crises win cash.",
        coverGradient: "from-fuchsia-500 to-purple-600",
        prize: "$1,500 + Notion AI annual",
        prizePool: 1500,
        startsAt: new Date(now - 1 * 86400000),
        endsAt: new Date(now + 5 * 86400000),
        status: "live",
        rules: "1. AI-themed only\n2. Original captions\n3. Funny > scary",
        sponsorName: "Notion",
        sponsorEmoji: "📝",
      },
      {
        title: "Cats vs Dogs: Final Boss",
        description: "Settle the eternal debate once and for all. Whichever side gets more total votes takes the crown.",
        coverGradient: "from-amber-300 to-orange-500",
        prize: "$1,000 + pet supply haul",
        prizePool: 1000,
        startsAt: new Date(now - 5 * 86400000),
        endsAt: new Date(now + 1 * 86400000),
        status: "live",
        rules: "1. Pick a side\n2. No AI-generated pets (we can tell)\n3. Cuteness is a weapon",
        sponsorName: "MemeArena",
        sponsorEmoji: "🏆",
      },
      {
        title: "Brand Roast Battle Royale",
        description: "Roast your favorite brand (lovingly). Brands are watching and the best roast gets hired for a paid campaign.",
        coverGradient: "from-sky-400 to-indigo-600",
        prize: "$3,000 brand contract",
        prizePool: 3000,
        startsAt: new Date(now + 3 * 86400000),
        endsAt: new Date(now + 10 * 86400000),
        status: "upcoming",
        rules: "1. Keep it playful, not cruel\n2. Tag the brand\n3. Winner gets a real paid deal",
        sponsorName: "Duolingo",
        sponsorEmoji: "🦉",
      },
      {
        title: "Wrapped: Your 2025 in Memes",
        description: "Summarize your entire year in a single meme. Nostalgia, regret, and growth all welcome.",
        coverGradient: "from-rose-400 to-red-600",
        prize: "$750",
        prizePool: 750,
        startsAt: new Date(now - 14 * 86400000),
        endsAt: new Date(now - 7 * 86400000),
        status: "ended",
        rules: "Ended. Winner: @memequeen with 4.2k votes.",
        sponsorName: "Chipotle",
        sponsorEmoji: "🌯",
      },
    ];
    const createdChallenges = await db.insert(challenges).values(seedChallenges).returning();

    // Memes
    const memeSeeds = [
      { user: "danklord", t: 7, title: "POV: standup in 5 minutes and you did nothing", tags: "work,relatable,standup" },
      { user: "memequeen", t: 0, title: "me after saying 'just one episode'", tags: "relatable,netflix" },
      { user: "frogposter", t: 1, title: "bro discovered inspect element", tags: "dev,coding" },
      { user: "corporatemillennial", t: 9, title: "HR: we're a family here", tags: "work,corporate" },
      { user: "grannymemes", t: 3, title: "when the grandkids teach me TikTok", tags: "wholesome,family" },
      { user: "midnightposter", t: 5, title: "sleep schedule? never heard of her", tags: "cursed,3am" },
      { user: "danklord", t: 11, title: "client: make the logo bigger", tags: "design,freelance" },
      { user: "memequeen", t: 4, title: "me explaining astrology to my therapist", tags: "relatable" },
      { user: "frogposter", t: 6, title: "moving out vs moving back in", tags: "relatable,adulting" },
      { user: "corporatemillennial", t: 8, title: "reading my own code after vacation", tags: "dev,work" },
      { user: "grannymemes", t: 2, title: "when someone says minions aren't funny", tags: "minions,wholesome" },
      { user: "midnightposter", t: 12, title: "me at 3am remembering 2016", tags: "nostalgia,3am" },
      { user: "danklord", t: 13, title: "watching repost accounts steal my banger", tags: "meta,memes" },
      { user: "memequeen", t: 10, title: "group chat after I send a risky meme", tags: "groupchat,relatable" },
    ];

    const createdMemes = [];
    for (let i = 0; i < memeSeeds.length; i++) {
      const s = memeSeeds[i];
      const tpl = MEME_TEMPLATES[s.t % MEME_TEMPLATES.length];
      const base = 800 - i * 42 + Math.floor(Math.random() * 120);
      const up = Math.max(24, base);
      const down = Math.floor(Math.random() * 30);
      const [m] = await db
        .insert(memes)
        .values({
          userId: byHandle[s.user].id,
          title: s.title,
          imageUrl: tpl.imageUrl,
          topText: tpl.defaultTop,
          bottomText: tpl.defaultBottom,
          tags: s.tags,
          template: tpl.id,
          upvotes: up,
          downvotes: down,
          score: up - down,
          views: up * 12 + Math.floor(Math.random() * 3000),
          commentsCount: 2 + Math.floor(Math.random() * 6),
          createdAt: new Date(now - i * 5 * 3600000 - Math.floor(Math.random() * 3600000)),
        })
        .returning();
      createdMemes.push(m);
    }

    // votes from users on memes (for realistic state)
    for (const m of createdMemes.slice(0, 8)) {
      for (const u of createdUsers.slice(0, 6)) {
        try {
          await db.insert(votes).values({ memeId: m.id, userId: u.id, value: Math.random() > 0.15 ? 1 : -1 }).onConflictDoNothing();
        } catch { /* ignore */ }
      }
    }

    // comments
    const commentTexts = [
      "This is way too accurate 💀",
      "Bro I felt this in my soul",
      "Screenshotted and sent to the group chat instantly",
      "The duality of memer 😭🔥",
      "Underrated banger, boosting this",
      "I was here before it hit hot 🔥",
      "My therapist will hear about this meme",
      "Printing this and framing it",
      "Certified hood classic",
      "No thoughts just vibes. 10/10",
    ];
    for (const m of createdMemes.slice(0, 10)) {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        const u = createdUsers[Math.floor(Math.random() * 6)];
        await db.insert(comments).values({
          memeId: m.id,
          userId: u.id,
          body: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          likes: Math.floor(Math.random() * 40),
        });
      }
    }

    // challenge entries: link some memes to live challenges
    const liveIds = createdChallenges.filter((c) => c.status === "live").map((c) => c.id);
    for (let i = 0; i < 9; i++) {
      const chId = liveIds[i % liveIds.length];
      const m = createdMemes[i];
      await db.insert(challengeEntries).values({ challengeId: chId, memeId: m.id, userId: m.userId, votes: m.score });
    }
    for (const chId of liveIds) {
      await db.execute(sql`UPDATE challenges SET entry_count = (SELECT COUNT(*) FROM challenge_entries WHERE challenge_id = ${chId}), votes_count = (SELECT COALESCE(SUM(votes),0) FROM challenge_entries WHERE challenge_id = ${chId}) WHERE id = ${chId}`);
    }

    // campaigns
    const seedCampaigns = [
      {
        brand: "duolingo", name: "Duolingo", emoji: "🦉",
        title: "Unhinged Owl Summer — Meme Creators Wanted",
        brief: "We need 10 memers to make the owl even more unhinged this summer. Think: guilt-tripping streak memes, passive-aggressive push notification energy, feral owl lore. Best performers get a 3-month retainer.",
        category: "Entertainment", min: 500, max: 2500,
        req: "• 10k+ followers preferred\n• Must have posted an owl meme before (we check)\n• Deliver 4 memes + 2 video concepts",
      },
      {
        brand: "liquiddeath", name: "Liquid Death", emoji: "💀",
        title: "Murder Your Thirst: Cursed Meme Drop",
        brief: "We sell water in a tallboy and our fans are degenerates (affectionate). Make us the most unhinged beverage memes on the internet. Death, metal, hydration.",
        category: "Beverage", min: 800, max: 4000,
        req: "• Edgy humor required\n• 3 static memes + 1 motion meme\n• Must include can somehow",
      },
      {
        brand: "notion", name: "Notion", emoji: "📝",
        title: "Second Brain, First Meme",
        brief: "Notion is where ideas live — including terrible ones. Show us your most chaotic workspace, your 47 unfinished projects, your 'organized' chaos. Relatable productivity memes.",
        category: "Tech", min: 400, max: 1800,
        req: "• Screenshot-friendly formats\n• 5 memes, productivity theme\n• Bonus for templates",
      },
      {
        brand: "chipotle", name: "Chipotle", emoji: "🌯",
        title: "Burrito Order Lore Challenge",
        brief: "Everyone has a burrito order and a personality to match. Meme the archetypes: double-wrap guy, bowl superiority complex, extra guac = rich mindset.",
        category: "Food", min: 600, max: 3000,
        req: "• Food memes only\n• Must feature a real order\n• 4 memes + story versions",
      },
      {
        brand: "duolingo", name: "Duolingo", emoji: "🦉",
        title: "Streak Freeze Confessions",
        brief: "732-day streak holders: we want your confession memes. What did you sacrifice for the streak? Relationships? Sleep? Dignity?",
        category: "Entertainment", min: 300, max: 1200,
        req: "• Streak screenshot proof\n• 3 confession-format memes",
      },
    ];
    const createdCampaigns = [];
    for (const c of seedCampaigns) {
      const [row] = await db
        .insert(campaigns)
        .values({
          brandUserId: byHandle[c.brand].id,
          brandName: c.name,
          brandLogoEmoji: c.emoji,
          title: c.title,
          brief: c.brief,
          category: c.category,
          budgetMin: c.min,
          budgetMax: c.max,
          deadline: new Date(now + (7 + Math.floor(Math.random() * 14)) * 86400000),
          status: "open",
          requirements: c.req,
          applicants: 0,
        })
        .returning();
      createdCampaigns.push(row);
    }

    // applications
    const pitches = [
      "I average 200k views per meme and my audience is exactly your demo. I have 3 concepts ready: feral owl POV series.",
      "Full-time memer, 90k followers, 12% engagement. I can deliver in 48h and I already drink your product daily.",
      "My last 5 memes all hit hot. I specialize in relatable chaos and I have a banger idea for this brief already sketched.",
    ];
    for (let i = 0; i < createdCampaigns.length; i++) {
      const camp = createdCampaigns[i];
      const applicantsList = [createdUsers[i % 6], createdUsers[(i + 2) % 6]];
      for (let k = 0; k < applicantsList.length; k++) {
        const memer = applicantsList[k];
        await db.insert(applications).values({
          campaignId: camp.id,
          memerId: memer.id,
          pitch: pitches[(i + k) % pitches.length],
          portfolioUrl: `https://memearena.gg/u/${memer.handle}`,
          status: k === 0 && i < 2 ? "accepted" : "pending",
        });
      }
      await db.execute(sql`UPDATE campaigns SET applicants = 2 WHERE id = ${camp.id}`);
    }

    return NextResponse.json({ ok: true, message: "seeded", users: createdUsers.length, memes: createdMemes.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "seed failed", detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const counts = await db.execute(sql`
    SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM memes) as memes,
    (SELECT COUNT(*) FROM challenges) as challenges, (SELECT COUNT(*) FROM campaigns) as campaigns
  `);
  return NextResponse.json({ counts: counts.rows[0] });
}
