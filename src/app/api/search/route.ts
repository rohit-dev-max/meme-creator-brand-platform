import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memes, users, blockedTerms, searchHistory } from "@/db/schema";
import { or, ilike, eq, sql, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tab = searchParams.get("tab") ?? "memes";
  const category = searchParams.get("category") ?? "";
  const range = searchParams.get("range") ?? "all";
  const sort = searchParams.get("sort") ?? "top";
  const me = await getSessionUser();

  if (!q) return NextResponse.json({ memes: [], creators: [], tags: [], query: q });

  // blocked terms
  const lower = q.toLowerCase();
  const blocked = await db.select().from(blockedTerms);
  const isBlocked = blocked.some((b) => lower.includes(b.term.toLowerCase()));
  if (isBlocked) {
    return NextResponse.json({
      blocked: true,
      message: "This content isn't available on MemeVault.",
      memes: [],
      creators: [],
      tags: [],
    });
  }

  // save history
  if (me) {
    try {
      await db.insert(searchHistory).values({ userId: me.id, query: q.slice(0, 120) });
    } catch { /* ignore */ }
  }

  // time range
  const now = Date.now();
  const rangeMs =
    range === "today" ? 86400000 : range === "week" ? 7 * 86400000 : range === "month" ? 30 * 86400000 : 0;

  const conditions = [
    or(
      ilike(memes.title, `%${q}%`),
      ilike(memes.topText, `%${q}%`),
      ilike(memes.bottomText, `%${q}%`),
      ilike(memes.tags, `%${q}%`)
    ),
    eq(memes.isNsfw, false),
    eq(memes.moderationStatus, "approved"),
  ];
  if (category) conditions.push(ilike(memes.tags, `%${category}%`));
  if (rangeMs > 0) {
    conditions.push(sql`${memes.createdAt} > ${new Date(now - rangeMs)}`);
  }

  const orderBy =
    sort === "latest"
      ? sql`${memes.createdAt} DESC`
      : sort === "comments"
        ? sql`${memes.commentsCount} DESC`
        : sql`${memes.score} DESC`;

  const memeRows = await db
    .select({
      id: memes.id,
      title: memes.title,
      imageUrl: memes.imageUrl,
      topText: memes.topText,
      bottomText: memes.bottomText,
      tags: memes.tags,
      score: memes.score,
      upvotes: memes.upvotes,
      views: memes.views,
      commentsCount: memes.commentsCount,
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
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(30);

  const creatorRows = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
      bio: users.bio,
      followers: users.followers,
      verified: users.verified,
      xp: users.xp,
    })
    .from(users)
    .where(or(ilike(users.handle, `%${q}%`), ilike(users.displayName, `%${q}%`)))
    .limit(20);

  // tags
  const tagRows = await db.execute(sql`
    SELECT DISTINCT unnest(string_to_array(${memes.tags}, ',')) as tag
    FROM ${memes}
    WHERE ${memes.tags} ILIKE ${`%${q}%`}
    LIMIT 10
  `);

  return NextResponse.json({
    memes: memeRows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    creators: creatorRows,
    tags: tagRows.rows.map((r) => (r as { tag: string }).tag).filter(Boolean),
    query: q,
  });
}
