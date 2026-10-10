import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challenges, challengeEntries, memes, users, votes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const viewerId = searchParams.get("viewerId");

  const list = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  if (list.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  const c = list[0];

  const entries = await db
    .select({
      entryId: challengeEntries.id,
      entryVotes: challengeEntries.votes,
      enteredAt: challengeEntries.createdAt,
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
    .from(challengeEntries)
    .innerJoin(memes, eq(challengeEntries.memeId, memes.id))
    .innerJoin(users, eq(challengeEntries.userId, users.id))
    .where(eq(challengeEntries.challengeId, id))
    .orderBy(desc(memes.score))
    .limit(50);

  let voteMap: Record<string, number> = {};
  if (viewerId) {
    const v = await db.select().from(votes).where(eq(votes.userId, viewerId));
    for (const row of v) voteMap[row.memeId] = row.value;
  }

  return NextResponse.json({
    challenge: {
      ...c,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    },
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      enteredAt: e.enteredAt.toISOString(),
      userVote: voteMap[e.id] ?? 0,
    })),
  });
}
