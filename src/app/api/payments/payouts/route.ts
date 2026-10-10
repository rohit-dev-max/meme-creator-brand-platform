import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payouts, payments, tips } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const PLATFORM_FEE = Number(process.env.PLATFORM_FEE ?? 10);

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const totalTips = await db.execute(sql`
    SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_user_id = ${me.id}
  `);
  const total = Number((totalTips.rows[0] as { total: string }).total);
  const platformFee = Math.round(total * (PLATFORM_FEE / 100));
  const net = total - platformFee;

  const myPayouts = await db
    .select()
    .from(payouts)
    .where(eq(payouts.userId, me.id))
    .orderBy(sql`created_at DESC`)
    .limit(20);

  return NextResponse.json({
    earnings: { total, platformFee, net, currency: "INR" },
    payouts: myPayouts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
  });
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const ip = clientIp(req);
  const rl = rateLimit(`payout:${me.id}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { amount, method, destination } = await req.json();
  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Minimum ₹1." }, { status: 400 });
  }
  if (!destination?.trim()) {
    return NextResponse.json({ error: "Destination (UPI ID or account) required." }, { status: 400 });
  }

  const [payout] = await db
    .insert(payouts)
    .values({
      userId: me.id,
      amount: Math.round(Number(amount) * 100),
      method: method === "bank" ? "bank" : "upi",
      destination: String(destination).slice(0, 200),
      status: "pending",
    })
    .returning();

  return NextResponse.json({ payout }, { status: 201 });
}
