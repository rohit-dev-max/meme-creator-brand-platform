import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, users, memes, notifications } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memeId = searchParams.get("memeId");
  if (!memeId) return NextResponse.json({ error: "memeId required" }, { status: 400 });
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      likes: comments.likes,
      createdAt: comments.createdAt,
      userId: comments.userId,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
      verified: users.verified,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.memeId, memeId))
    .orderBy(desc(comments.createdAt))
    .limit(100);
  return NextResponse.json({
    comments: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Log in to comment." }, { status: 401 });

    const { memeId, body } = req.body ? await req.json() : {};
    if (!memeId || !body?.trim()) {
      return NextResponse.json({ error: "memeId, body required" }, { status: 400 });
    }

    const memeRows = await db.select().from(memes).where(eq(memes.id, memeId)).limit(1);
    if (memeRows.length === 0) return NextResponse.json({ error: "Meme not found" }, { status: 404 });

    const [c] = await db
      .insert(comments)
      .values({ memeId, userId: me.id, body: String(body).slice(0, 500) })
      .returning();

    await db.execute(sql`UPDATE memes SET comments_count = comments_count + 1 WHERE id = ${memeId}`);
    await db.execute(sql`UPDATE users SET xp = xp + 10 WHERE id = ${me.id}`);

    // notify meme author
    if (memeRows[0].userId !== me.id) {
      await db.insert(notifications).values({
        userId: memeRows[0].userId,
        type: "comment",
        actorId: me.id,
        memeId,
        commentId: c.id,
        title: "New comment",
        body: `@${me.handle} commented on your meme`,
      });
    }

    return NextResponse.json({ comment: c }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
