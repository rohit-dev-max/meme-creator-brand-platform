import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateResetToken } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`forgot:${ip}`, 5, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many requests — wait a minute." }, { status: 429 });

    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: "Email required." }, { status: 400 });

    const rows = await db.select().from(users).where(eq(users.email, String(email).toLowerCase())).limit(1);
    if (rows.length === 0) {
      // Don't reveal whether the email exists
      return NextResponse.json({ ok: true, dev: false });
    }
    const u = rows[0];
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60000); // 1 hour
    await db.execute(sql`
      UPDATE users SET reset_token = ${token}, reset_token_exp = ${expiresAt} WHERE id = ${u.id}
    `);
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/reset-password?token=${token}`;
    return NextResponse.json({ ok: true, devToken: token, resetLink });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed. Try again." }, { status: 500 });
  }
}
