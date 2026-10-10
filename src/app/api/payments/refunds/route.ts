import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { refunds, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`refund:${me.id}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { paymentId, reason } = await req.json();
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const rows = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (rows[0].userId !== me.id) return NextResponse.json({ error: "Not yours" }, { status: 403 });

  const [refund] = await db
    .insert(refunds)
    .values({
      paymentId,
      userId: me.id,
      amount: rows[0].amount,
      reason: String(reason ?? "").slice(0, 500),
      status: "pending",
    })
    .returning();

  return NextResponse.json({ refund }, { status: 201 });
}
