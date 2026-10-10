import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, memes } from "@/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";

export async function GET() {
  const topMemers = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
      verified: users.verified,
      xp: users.xp,
      level: users.level,
      followers: users.followers,
      memeCount: count(memes.id),
      totalScore: sql<number>`COALESCE(SUM(${memes.score}), 0)`,
    })
    .from(users)
    .leftJoin(memes, eq(memes.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.xp))
    .limit(20);

  const topMemes = await db
    .select({
      id: memes.id,
      title: memes.title,
      imageUrl: memes.imageUrl,
      topText: memes.topText,
      bottomText: memes.bottomText,
      score: memes.score,
      upvotes: memes.upvotes,
      views: memes.views,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
    })
    .from(memes)
    .innerJoin(users, eq(memes.userId, users.id))
    .orderBy(desc(memes.score))
    .limit(5);

  const stats = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM memes) as memes,
      (SELECT COUNT(*) FROM users) as memers,
      (SELECT COALESCE(SUM(score),0) FROM memes) as votes,
      (SELECT COUNT(*) FROM challenges WHERE status='live') as live_battles
  `);

  return NextResponse.json({ topMemers, topMemes, stats: stats.rows[0] });
}
