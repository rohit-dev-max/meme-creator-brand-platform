import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password, confirmPassword } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Token and password required." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: "Passwords don't match." }, { status: 400 });

    const rows = await db.select().from(users).where(eq(users.resetToken, String(token))).limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
    const u = rows[0];
    if (u.resetTokenExp && new Date(u.resetTokenExp) < new Date()) {
      return NextResponse.json({ error: "Link expired. Request a new one." }, { status: 410 });
    }
    const pwHash = await hashPassword(String(password));
    await db.execute(sql`
      UPDATE users SET password_hash = ${pwHash}, reset_token = NULL, reset_token_exp = NULL, failed_logins = 0 WHERE id = ${u.id}
    `);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed. Try again." }, { status: 500 });
  }
}
