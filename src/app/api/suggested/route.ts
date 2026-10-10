import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, follows, memes, votes } from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

// Suggested creators: based on categories you react to + mutual follows
export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ suggested: [] });

  // categories I upvoted
  const myVotes = await db
    .select({ tags: memes.tags })
    .from(votes)
    .innerJoin(memes, eq(votes.memeId, memes.id))
    .where(and(eq(votes.userId, me.id), eq(votes.value, 1)))
    .limit(50);

  const tagCounts: Record<string, number> = {};
  for (const v of myVotes) {
    for (const t of v.tags.split(",")) {
      const clean = t.trim().toLowerCase();
      if (clean) tagCounts[clean] = (tagCounts[clean] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

  // creators whose memes match my tags, excluding people I follow
  const myFollowing = await db.select().from(follows).where(eq(follows.followerId, me.id));
  const followingIds = new Set(myFollowing.map((f) => f.followingId));
  followingIds.add(me.id);

  let suggested: Array<{
    id: string;
    handle: string;
    displayName: string;
    avatarEmoji: string;
    avatarColor: string;
    bio: string;
    followers: number;
    verified: boolean;
    score: number;
  }> = [];

  if (topTags.length > 0) {
    const placeholders = Array.from(followingIds).map(() => "?").join(", ");
    const tagPlaceholders = topTags.map(() => "m.tags ILIKE ?").join(" OR ");
    const params = [...followingIds, ...topTags.map((t) => `%${t}%`)];
    const rows = await db.execute(sql`
      SELECT u.id, u.handle, u.display_name, u.avatar_emoji, u.avatar_color, u.bio, u.followers, u.verified,
             COALESCE(SUM(m.score), 0) as score
      FROM users u
      JOIN memes m ON m.user_id = u.id
      WHERE u.id NOT IN (${sql.join(Array.from(followingIds), sql`, `)})
        AND (${sql.join(topTags.map((t) => sql`m.tags ILIKE ${`%${t}%`}`), sql` OR `)})
        AND m.is_nsfw = FALSE AND m.moderation_status = 'approved'
      GROUP BY u.id
      ORDER BY score DESC
      LIMIT 5
    `);
    suggested = rows.rows as typeof suggested;
  }

  // fallback: top creators overall
  if (suggested.length < 3) {
    const fallback = await db
      .select({
        id: users.id,
        handle: users.handle,
        displayName: users.displayName,
        avatarEmoji: users.avatarEmoji,
        avatarColor: users.avatarColor,
        bio: users.bio,
        followers: users.followers,
        verified: users.verified,
        score: sql<number>`COALESCE(SUM(${memes.score}), 0)`,
      })
      .from(users)
      .leftJoin(memes, eq(memes.userId, users.id))
      .where(sql`${users.id} NOT IN (${Array.from(followingIds).map(() => "?").join(", ")})`)
      .groupBy(users.id)
      .orderBy(desc(sql`score`))
      .limit(5);
    suggested = fallback as typeof suggested;
  }

  return NextResponse.json({ suggested });
}
