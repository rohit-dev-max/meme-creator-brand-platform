import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, tips, users, subscriptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const PLATFORM_FEE = Number(process.env.PLATFORM_FEE ?? 10); // %

// Razorpay test-mode helpers (no key needed for demo; real keys in env)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "rzp_test_000000000000";
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET ?? "test_secret";

function razorpayAuth(orderId: string, paymentId: string, signature: string): string {
  // HMAC SHA256 of orderId|paymentId with secret
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature ? "valid" : "invalid";
}

export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Log in to pay." }, { status: 401 });

    const ip = clientIp(req);
    const rl = rateLimit(`pay:${me.id}`, 20, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const { kind, amount, targetUserId, memeId, plan, idempotencyKey, method } = await req.json();
    if (!["tip", "pro", "boost"].includes(kind)) {
      return NextResponse.json({ error: "Invalid payment kind." }, { status: 400 });
    }
    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Minimum ₹1." }, { status: 400 });
    }
    if (!idempotencyKey) {
      return NextResponse.json({ error: "Idempotency key required." }, { status: 400 });
    }

    // idempotency: same key = same result
    const existing = await db.select().from(payments).where(eq(payments.idempotencyKey, idempotencyKey)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ payment: existing[0], duplicate: true });
    }

    const amountPaise = Math.round(Number(amount) * 100);

    // In test mode we simulate the gateway flow:
    // 1. Create order (server)
    // 2. Client opens Razorpay Checkout (or we simulate success)
    // 3. Server verifies signature + webhook
    // Here we create the payment record and return a demo checkout URL.

    const [payment] = await db
      .insert(payments)
      .values({
        userId: me.id,
        kind,
        amount: amountPaise,
        currency: "INR",
        status: "created",
        gateway: "razorpay",
        gatewayOrderId: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        idempotencyKey,
        meta: {
          targetUserId: targetUserId || null,
          memeId: memeId || null,
          plan: plan || null,
          method: method || "upi",
        },
      })
      .returning();

    return NextResponse.json({
      payment,
      checkout: {
        key: RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: "INR",
        orderId: payment.gatewayOrderId,
        name: "MemeVault",
        description: `${kind} payment`,
        // In production: redirect to Razorpay Checkout with these params
        demo: true,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Payment failed." }, { status: 500 });
  }
}

// Verify payment (called after Razorpay redirect/webhook)
export async function PUT(req: NextRequest) {
  try {
    const { paymentId, razorpayPaymentId, razorpaySignature } = await req.json();
    if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

    const rows = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const p = rows[0];

    // Verify signature (server-side)
    const sig = razorpaySignature ?? "demo_signature";
    const valid = razorpayAuth(p.gatewayOrderId ?? "", razorpayPaymentId ?? "", sig);

    if (valid === "invalid") {
      await db.execute(sql`UPDATE payments SET status = 'failed' WHERE id = ${paymentId}`);
      return NextResponse.json({ ok: false, status: "failed" });
    }

    await db.execute(sql`
      UPDATE payments
      SET status = 'paid', gateway_payment_id = ${razorpayPaymentId ?? `pay_demo_${Date.now()}`}, gateway_signature = ${sig}
      WHERE id = ${paymentId}
    `);

    // Post-payment actions
    if (p.kind === "tip" && p.userId) {
      const meta = (p.meta ?? {}) as { targetUserId?: string; memeId?: string };
      if (meta.targetUserId) {
        await db.insert(tips).values({
          fromUserId: p.userId,
          toUserId: meta.targetUserId,
          memeId: meta.memeId || null,
          amount: p.amount,
          paymentId: p.id,
        });
        // notify creator
        await db.execute(sql`
          INSERT INTO notifications (user_id, type, actor_id, meme_id, title, body)
          VALUES (${meta.targetUserId}, 'tip', ${p.userId}, ${meta.memeId || null}, 'Tip received', 'Someone tipped you ₹' || ${p.amount / 100})
        `);
      }
    }

    if (p.kind === "pro" && p.userId) {
      const meta = (p.meta ?? {}) as { plan?: string };
      const months = meta.plan === "pro_yearly" ? 12 : 1;
      const endsAt = new Date(Date.now() + months * 30 * 86400000);
      await db.execute(sql`UPDATE users SET is_pro = TRUE, pro_expires_at = ${endsAt} WHERE id = ${p.userId}`);
      await db.insert(subscriptions).values({
        userId: p.userId,
        plan: meta.plan ?? "pro_monthly",
        amount: p.amount,
        status: "active",
        endsAt,
      });
    }

    return NextResponse.json({ ok: true, status: "paid" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
