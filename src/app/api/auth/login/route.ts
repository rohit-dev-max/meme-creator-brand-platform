import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { or, eq } from "drizzle-orm";
import { verifyPassword, createSessionAndToken, bumpFailedLogins, isAccountLocked } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}`, 20, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many attempts — wait a minute." }, { status: 429 });

    const { login, password, remember } = await req.json();
    if (!login?.trim() || !password) {
      return NextResponse.json({ error: "Email/username and password required." }, { status: 400 });
    }

    const key = String(login).trim();
    const lookup = key.includes("@")
      ? eq(users.email, key.toLowerCase())
      : eq(users.handle, key.toLowerCase());
    const rows = await db
      .select()
      .from(users)
      .where(lookup)
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No account found with that email/username." }, { status: 401 });
    }
    const u = rows[0];

    if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) {
      return NextResponse.json({ error: "Account locked — too many attempts. Try again in 15 minutes." }, { status: 423 });
    }

    const ok = await verifyPassword(String(password), u.passwordHash);
    if (!ok) {
      const attempts = await bumpFailedLogins(u.id);
      const remaining = 5 - attempts;
      if (remaining <= 0) {
        return NextResponse.json({ error: "Account locked — too many failed attempts (15 min)." }, { status: 423 });
      }
      return NextResponse.json({ error: `Wrong password. ${remaining} attempt${remaining === 1 ? "" : "s"} left.` }, { status: 401 });
    }

    if (!u.emailVerified) {
      return NextResponse.json({ error: "Verify your email first — check your inbox.", code: "UNVERIFIED" }, { status: 403 });
    }

    const ua = req.headers.get("user-agent") ?? "unknown";
    await createSessionAndToken(u.id, ua, !!remember);

    return NextResponse.json({
      user: { id: u.id, handle: u.handle, displayName: u.displayName, role: u.role, emailVerified: true },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed. Try again." }, { status: 500 });
  }
}
