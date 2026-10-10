import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memes, users, votes, challengeEntries, blockedTerms } from "@/db/schema";
import { desc, eq, and, sql, ilike, or } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "hot";
  const tag = searchParams.get("tag");
  const search = searchParams.get("q");
  const viewerId = searchParams.get("viewerId");
  const handle = searchParams.get("handle");
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 60);

  let orderBy: ReturnType<typeof desc> | ReturnType<typeof sql> = desc(memes.score);
  if (sort === "new") orderBy = desc(memes.createdAt);
  else if (sort === "top") orderBy = desc(memes.upvotes);
  else if (sort === "hot") orderBy = desc(sql`${memes.score} - EXTRACT(EPOCH FROM (NOW() - ${memes.createdAt})) / 36000`);

  const conditions: Array<ReturnType<typeof eq>> = [
    eq(memes.isNsfw, false),
    eq(memes.moderationStatus, "approved"),
  ];
  if (tag) conditions.push(ilike(memes.tags, `%${tag}%`) as ReturnType<typeof eq>);
  if (search) {
    conditions.push(
      or(ilike(memes.title, `%${search}%`), ilike(memes.topText, `%${search}%`), ilike(memes.bottomText, `%${search}%`)) as ReturnType<typeof eq>
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: memes.id,
      title: memes.title,
      imageUrl: memes.imageUrl,
      topText: memes.topText,
      bottomText: memes.bottomText,
      tags: memes.tags,
      upvotes: memes.upvotes,
      downvotes: memes.downvotes,
      score: memes.score,
      views: memes.views,
      commentsCount: memes.commentsCount,
      template: memes.template,
      createdAt: memes.createdAt,
      userId: memes.userId,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
      verified: users.verified,
    })
    .from(memes)
    .innerJoin(users, eq(memes.userId, users.id))
    .where(whereClause)
    .orderBy(orderBy as never)
    .limit(limit);

  let filtered = rows;
  if (handle) filtered = rows.filter((r) => r.handle === handle);

  let voteMap: Record<string, number> = {};
  if (viewerId) {
    const v = await db.select().from(votes).where(eq(votes.userId, viewerId));
    for (const row of v) voteMap[row.memeId] = row.value;
  }

  const data = filtered.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    userVote: voteMap[r.id] ?? 0,
  }));

  return NextResponse.json({ memes: data });
}

export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Log in to post memes." }, { status: 401 });

    const body = await req.json();
    const { title, imageUrl, topText, bottomText, tags, template, challengeId } = body;
    if (!title || !imageUrl) {
      return NextResponse.json({ error: "title, imageUrl required" }, { status: 400 });
    }

    // moderation: blocked terms in text
    const lower = `${title} ${topText ?? ""} ${bottomText ?? ""} ${tags ?? ""}`.toLowerCase();
    const blocked = await db.select().from(blockedTerms);
    const hit = blocked.find((b) => lower.includes(b.term.toLowerCase()));
    if (hit) {
      return NextResponse.json({ error: "That content isn't allowed here." }, { status: 400 });
    }

    const [meme] = await db
      .insert(memes)
      .values({
        userId: me.id,
        title: String(title).slice(0, 120),
        imageUrl: String(imageUrl).slice(0, 600000),
        topText: String(topText ?? "").slice(0, 80),
        bottomText: String(bottomText ?? "").slice(0, 80),
        tags: String(tags ?? "").slice(0, 200),
        template: String(template ?? "custom").slice(0, 40),
        upvotes: 1,
        score: 1,
        isNsfw: false,
        moderationStatus: "approved",
      })
      .returning();

    await db.insert(votes).values({ memeId: meme.id, userId: me.id, value: 1 }).onConflictDoNothing();
    await db.execute(sql`UPDATE users SET xp = xp + 50, level = FLOOR((xp + 50) / 1000) + 1 WHERE id = ${me.id}`);

    if (challengeId) {
      try {
        await db.insert(challengeEntries).values({ challengeId, memeId: meme.id, userId: me.id, votes: 1 });
        await db.execute(sql`UPDATE challenges SET entry_count = entry_count + 1 WHERE id = ${challengeId}`);
      } catch { /* ignore */ }
    }

    return NextResponse.json({ meme }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to create meme" }, { status: 500 });
  }
}
