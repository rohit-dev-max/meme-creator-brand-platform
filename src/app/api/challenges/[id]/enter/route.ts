import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challengeEntries, memes, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: challengeId } = await params;
  try {
    const body = await req.json();
    const { memeId, userId } = body;
    // allow entering with existing meme OR creating new meme inline
    if (memeId && userId) {
      await db.insert(challengeEntries).values({ challengeId, memeId, userId, votes: 0 });
      await db.execute(sql`UPDATE challenges SET entry_count = entry_count + 1 WHERE id = ${challengeId}`);
      return NextResponse.json({ ok: true });
    }
    const { title, imageUrl, topText, bottomText, tags, template } = body;
    if (!userId || !title || !imageUrl) {
      return NextResponse.json({ error: "need memeId or new meme fields" }, { status: 400 });
    }
    const [meme] = await db
      .insert(memes)
      .values({
        userId,
        title: String(title).slice(0, 120),
        imageUrl: String(imageUrl).slice(0, 2000),
        topText: String(topText ?? "").slice(0, 80),
        bottomText: String(bottomText ?? "").slice(0, 80),
        tags: String(tags ?? "").slice(0, 200),
        template: String(template ?? "custom").slice(0, 40),
        upvotes: 1,
        score: 1,
      })
      .returning();
    await db.insert(challengeEntries).values({ challengeId, memeId: meme.id, userId, votes: 1 });
    await db.execute(sql`UPDATE challenges SET entry_count = entry_count + 1 WHERE id = ${challengeId}`);
    await db.execute(sql`UPDATE users SET xp = xp + 75 WHERE id = ${userId}`);
    return NextResponse.json({ ok: true, memeId: meme.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to enter" }, { status: 500 });
  }
}
