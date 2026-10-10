import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blocks, follows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { targetId } = await req.json();
  if (!targetId || targetId === me.id) {
    return NextResponse.json({ error: "Invalid target." }, { status: 400 });
  }
  await db.insert(blocks).values({ blockerId: me.id, blockedId: targetId }).onConflictDoNothing();
  // remove follow both ways
  await db.delete(follows).where(and(eq(follows.followerId, me.id), eq(follows.followingId, targetId)));
  await db.delete(follows).where(and(eq(follows.followerId, targetId), eq(follows.followingId, me.id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const targetId = req.nextUrl.searchParams.get("targetId");
  if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });
  await db.delete(blocks).where(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, targetId)));
  return NextResponse.json({ ok: true });
}
