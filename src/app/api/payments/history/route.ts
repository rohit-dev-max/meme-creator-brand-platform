import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, tips, users } from "@/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const myPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, me.id))
    .orderBy(desc(payments.createdAt))
    .limit(50);

  const myTips = await db
    .select({
      id: tips.id,
      amount: tips.amount,
      createdAt: tips.createdAt,
      fromHandle: users.handle,
      fromName: users.displayName,
      fromEmoji: users.avatarEmoji,
    })
    .from(tips)
    .innerJoin(users, eq(tips.fromUserId, users.id))
    .where(eq(tips.toUserId, me.id))
    .orderBy(desc(tips.createdAt))
    .limit(50);

  return NextResponse.json({
    payments: myPayments.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    tips: myTips.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  });
}
