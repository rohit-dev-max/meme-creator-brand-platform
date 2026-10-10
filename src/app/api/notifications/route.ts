import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      read: notifications.read,
      createdAt: notifications.createdAt,
      memeId: notifications.memeId,
      commentId: notifications.commentId,
      actorId: notifications.actorId,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  // group similar: same type + same memeId
  const grouped: Record<string, { items: typeof rows; count: number }> = {};
  for (const r of rows) {
    const key = `${r.type}:${r.memeId ?? "none"}`;
    if (!grouped[key]) grouped[key] = { items: [], count: 0 };
    grouped[key].items.push(r);
    grouped[key].count++;
  }

  const list = Object.values(grouped).map((g) => {
    const first = g.items[0];
    const others = g.items.slice(1);
    let body = first.body;
    if (g.count > 1) {
      const names = [first.displayName, ...others.slice(0, 2).map((o) => o.displayName)];
      body = `${names.join(", ")}${g.count > 3 ? ` and ${g.count - 3} others` : ""} ${first.type === "follow" ? "followed you" : "reacted to your meme"}`;
    }
    return {
      ...first,
      body,
      count: g.count,
      createdAt: first.createdAt.toISOString(),
    };
  });

  const unread = await db.execute(sql`
    SELECT COUNT(*) as c FROM notifications WHERE user_id = ${me.id} AND read = FALSE
  `);

  return NextResponse.json({
    notifications: list,
    unread: Number((unread.rows[0] as { c: string }).c),
  });
}

export async function PATCH(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id, readAll } = await req.json();
  if (readAll) {
    await db.execute(sql`UPDATE notifications SET read = TRUE WHERE user_id = ${me.id}`);
    return NextResponse.json({ ok: true });
  }
  if (id) {
    await db.execute(sql`UPDATE notifications SET read = TRUE WHERE id = ${id} AND user_id = ${me.id}`);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
