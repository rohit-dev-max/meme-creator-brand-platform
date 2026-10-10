import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

const TYPES = ["follow", "reaction", "comment", "mention", "new_post", "motw", "tip", "payment", "subscription", "moderation"];

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, me.id));
  const prefs: Record<string, { inApp: boolean; email: boolean }> = {};
  for (const r of rows) prefs[r.type] = { inApp: r.inApp, email: r.email };
  return NextResponse.json({ preferences: prefs, types: TYPES });
}

export async function PUT(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { type, inApp, email } = await req.json();
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  await db
    .insert(notificationPreferences)
    .values({ userId: me.id, type, inApp: !!inApp, email: !!email })
    .onConflictDoUpdate({
      target: [notificationPreferences.userId, notificationPreferences.type],
      set: { inApp: !!inApp, email: !!email },
    });
  return NextResponse.json({ ok: true });
}
