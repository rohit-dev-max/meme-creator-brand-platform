import { NextResponse } from "next/server";
import { db } from "@/db";
import { memes, users, weeklyWinners } from "@/db/schema";
import { desc, eq, sql, and, gte } from "drizzle-orm";

// Meme of the Week: original, approved, non-NSFW meme with most reactions
// in the previous 7 days. Tie-breakers: comments, views, earliest posted.

export async function GET() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const rows = await db
    .select({
      id: memes.id,
      title: memes.title,
      imageUrl: memes.imageUrl,
      topText: memes.topText,
      bottomText: memes.bottomText,
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
    .where(
      and(
        gte(memes.createdAt, weekAgo),
        eq(memes.isNsfw, false),
        eq(memes.moderationStatus, "approved")
      )
    )
    .orderBy(desc(memes.score), desc(memes.commentsCount), desc(memes.views), memes.createdAt)
    .limit(10);

  const winners = await db
    .select({
      id: weeklyWinners.id,
      week: weeklyWinners.week,
      score: weeklyWinners.score,
      createdAt: weeklyWinners.createdAt,
      memeId: memes.id,
      title: memes.title,
      imageUrl: memes.imageUrl,
      topText: memes.topText,
      bottomText: memes.bottomText,
      userId: memes.userId,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
    })
    .from(weeklyWinners)
    .innerJoin(memes, eq(weeklyWinners.memeId, memes.id))
    .innerJoin(users, eq(memes.userId, users.id))
    .orderBy(desc(weeklyWinners.createdAt))
    .limit(20);

  return NextResponse.json({
    leaderboard: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    hallOfFame: winners.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    })),
  });
}

// POST: run the weekly winner calculation (scheduled job)
export async function POST() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  const weekLabel = `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;

  const rows = await db
    .select({
      id: memes.id,
      userId: memes.userId,
      score: memes.score,
      createdAt: memes.createdAt,
    })
    .from(memes)
    .where(
      and(
        gte(memes.createdAt, weekAgo),
        eq(memes.isNsfw, false),
        eq(memes.moderationStatus, "approved")
      )
    )
    .orderBy(desc(memes.score), desc(memes.commentsCount), desc(memes.views), memes.createdAt)
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ ok: false, reason: "no eligible memes" });
  }
  const winner = rows[0];

  await db
    .insert(weeklyWinners)
    .values({
      week: weekLabel,
      memeId: winner.id,
      userId: winner.userId,
      score: winner.score,
      hallOfFame: true,
    })
    .onConflictDoUpdate({
      target: weeklyWinners.week,
      set: { memeId: winner.id, userId: winner.userId, score: winner.score },
    });

  return NextResponse.json({ ok: true, week: weekLabel, winnerId: winner.id });
}
