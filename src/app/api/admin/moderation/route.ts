import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { moderationFlags, memes, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const me = await getSessionUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const flags = await db
    .select({
      id: moderationFlags.id,
      reason: moderationFlags.reason,
      auto: moderationFlags.auto,
      status: moderationFlags.status,
      createdAt: moderationFlags.createdAt,
      memeId: memes.id,
      title: memes.title,
      imageUrl: memes.imageUrl,
      topText: memes.topText,
      bottomText: memes.bottomText,
      isNsfw: memes.isNsfw,
      moderationStatus: memes.moderationStatus,
      userId: users.id,
      handle: users.handle,
      displayName: users.displayName,
    })
    .from(moderationFlags)
    .innerJoin(memes, eq(moderationFlags.memeId, memes.id))
    .innerJoin(users, eq(memes.userId, users.id))
    .where(eq(moderationFlags.status, "open"))
    .orderBy(sql`created_at DESC`)
    .limit(50);

  return NextResponse.json({
    flags: flags.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
  });
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser();
  if (!me?.isAdmin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const { id, action } = await req.json();
  if (!id || !["approve", "reject", "nsfw", "dismiss"].includes(action)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const rows = await db.select().from(moderationFlags).where(eq(moderationFlags.id, id)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const flag = rows[0];

  if (action === "approve") {
    await db.execute(sql`UPDATE memes SET moderation_status = 'approved', is_nsfw = FALSE WHERE id = ${flag.memeId}`);
  } else if (action === "reject") {
    await db.execute(sql`UPDATE memes SET moderation_status = 'rejected' WHERE id = ${flag.memeId}`);
  } else if (action === "nsfw") {
    await db.execute(sql`UPDATE memes SET is_nsfw = TRUE, moderation_status = 'approved' WHERE id = ${flag.memeId}`);
  }
  await db.execute(sql`UPDATE moderation_flags SET status = 'resolved' WHERE id = ${id}`);

  return NextResponse.json({ ok: true });
}
