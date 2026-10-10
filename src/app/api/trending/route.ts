import { NextResponse } from "next/server";
import { db } from "@/db";
import { memes, searchHistory } from "@/db/schema";
import { desc, sql, eq, gte } from "drizzle-orm";

export async function GET() {
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const trendingMemes = await db
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
      createdAt: memes.createdAt,
    })
    .from(memes)
    .where(
      sql`${memes.createdAt} > ${weekAgo} AND ${memes.isNsfw} = FALSE AND ${memes.moderationStatus} = 'approved'`
    )
    .orderBy(desc(memes.score))
    .limit(10);

  const recentSearches = await db
    .select({ query: searchHistory.query })
    .from(searchHistory)
    .orderBy(desc(searchHistory.createdAt))
    .limit(10);

  return NextResponse.json({
    trending: trendingMemes.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    recentSearches: recentSearches.map((r) => r.query),
  });
}
