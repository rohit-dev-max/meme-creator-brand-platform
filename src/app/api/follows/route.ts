import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { follows, users, notifications } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Log in to follow creators." }, { status: 401 });

    const ip = clientIp(req);
    const rl = rateLimit(`follow:${me.id}`, 30, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const { targetId } = await req.json();
    if (!targetId || targetId === me.id) {
      return NextResponse.json({ error: "Can't follow yourself." }, { status: 400 });
    }

    // blocked check
    const blocked = await db.execute(sql`
      SELECT 1 FROM blocks WHERE (blocker_id = ${targetId} AND blocked_id = ${me.id})
    `);
    if (blocked.rows.length > 0) {
      return NextResponse.json({ error: "You can't follow this creator." }, { status: 403 });
    }

    const existing = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, me.id), eq(follows.followingId, targetId)))
      .limit(1);

    if (existing.length > 0) {
      // unfollow
      await db.delete(follows).where(eq(follows.id, existing[0].id));
      await db.execute(sql`UPDATE users SET followers = GREATEST(0, followers - 1) WHERE id = ${targetId}`);
      return NextResponse.json({ following: false });
    }

    await db.insert(follows).values({ followerId: me.id, followingId: targetId });
    await db.execute(sql`UPDATE users SET followers = followers + 1 WHERE id = ${targetId}`);

    // notification
    await db.insert(notifications).values({
      userId: targetId,
      type: "follow",
      actorId: me.id,
      title: "New follower",
      body: `@${me.handle} started following you`,
    });

    return NextResponse.json({ following: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const me = await getSessionUser();

  const following = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
      verified: users.verified,
      bio: users.bio,
      followers: users.followers,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .limit(100);

  const followers = await db
    .select({
      id: users.id,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
      verified: users.verified,
      bio: users.bio,
      followers: users.followers,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .limit(100);

  // mutuals for the viewer
  let mutualIds: string[] = [];
  if (me) {
    const myFollowing = await db.select().from(follows).where(eq(follows.followerId, me.id));
    const myFollowingIds = new Set(myFollowing.map((f) => f.followingId));
    mutualIds = followers.filter((f) => myFollowingIds.has(f.id)).map((f) => f.id);
  }

  return NextResponse.json({
    following,
    followers,
    mutualIds,
    counts: { following: following.length, followers: followers.length },
  });
}
