import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { memes, users, votes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const viewerId = searchParams.get("viewerId");

  // increment views
  await db.execute(sql`UPDATE memes SET views = views + 1 WHERE id = ${id}`);

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
      bio: users.bio,
      level: users.level,
      xp: users.xp,
    })
    .from(memes)
    .innerJoin(users, eq(memes.userId, users.id))
    .where(eq(memes.id, id))
    .limit(1);

  if (rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  let userVote = 0;
  if (viewerId) {
    const v = await db
      .select()
      .from(votes)
      .where(and(eq(votes.memeId, id), eq(votes.userId, viewerId)))
      .limit(1);
    if (v.length > 0) userVote = v[0].value;
  }

  const m = rows[0];
  return NextResponse.json({
    meme: { ...m, createdAt: m.createdAt.toISOString(), userVote },
  });
}
