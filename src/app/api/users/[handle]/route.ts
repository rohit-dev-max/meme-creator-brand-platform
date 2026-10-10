import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, memes, votes, follows } from "@/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { searchParams } = new URL(req.url);
  const viewerId = searchParams.get("viewerId");

  const found = await db.select().from(users).where(eq(users.handle, handle)).limit(1);
  if (found.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const user = found[0];

  const userMemes = await db
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
    .where(eq(memes.userId, user.id))
    .orderBy(desc(memes.score))
    .limit(30);

  let voteMap: Record<string, number> = {};
  if (viewerId) {
    const v = await db.select().from(votes).where(eq(votes.userId, viewerId));
    for (const row of v) voteMap[row.memeId] = row.value;
  }

  const totals = await db.execute(sql`
    SELECT COALESCE(SUM(score),0) as total_score, COALESCE(SUM(views),0) as total_views, COUNT(*) as count
    FROM memes WHERE user_id = ${user.id}
  `);

  // follow state
  let isFollowing = false;
  let isMutual = false;
  if (viewerId && viewerId !== user.id) {
    const f = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, user.id)))
      .limit(1);
    isFollowing = f.length > 0;
    const back = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, user.id), eq(follows.followingId, viewerId)))
      .limit(1);
    isMutual = back.length > 0;
  }

  return NextResponse.json({
    user,
    memes: userMemes.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), userVote: voteMap[m.id] ?? 0 })),
    totals: totals.rows[0],
    follow: { isFollowing, isMutual },
  });
}
