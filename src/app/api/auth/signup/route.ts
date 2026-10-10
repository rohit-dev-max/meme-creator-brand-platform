import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, generateVerifyToken } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`signup:${ip}`, 10, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many signups — wait a minute." }, { status: 429 });

    const body = await req.json();
    const { displayName, handle, email, password, confirmPassword, dob, agree } = body;

    if (!displayName?.trim() || !handle?.trim() || !email?.trim() || !password || !dob) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!EMAIL_RE.test(String(email))) {
      return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords don't match." }, { status: 400 });
    }
    if (!agree) {
      return NextResponse.json({ error: "Please accept the Terms & Community Guidelines." }, { status: 400 });
    }

    const cleanHandle = String(handle).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    if (cleanHandle.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }

    const existingHandle = await db.select().from(users).where(eq(users.handle, cleanHandle)).limit(1);
    if (existingHandle.length > 0) {
      return NextResponse.json({ error: "Username taken", field: "handle" }, { status: 409 });
    }
    const existingEmail = await db.select().from(users).where(eq(users.email, String(email).toLowerCase())).limit(1);
    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "Email already registered", field: "email" }, { status: 409 });
    }

    const pwHash = await hashPassword(String(password));
    const verifyToken = generateVerifyToken();
    const emojis = ["🔥", "😹", "💀", "🐸", "🤡", "👾", "🧠", "🚀", "⚡", "🎭"];
    const colors = ["#a3e635", "#e879f9", "#22d3ee", "#fbbf24", "#fb7185", "#818cf8"];

    const [u] = await db
      .insert(users)
      .values({
        handle: cleanHandle,
        displayName: String(displayName).slice(0, 40),
        email: String(email).toLowerCase(),
        passwordHash: pwHash,
        dob: String(dob),
        avatarEmoji: emojis[Math.floor(Math.random() * emojis.length)],
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        bio: "Fresh memer in the Arena 🫡",
        role: "memer",
        xp: 50,
        level: 1,
        verifyToken,
        emailVerified: false,
      })
      .returning();

    // In production: send email with link /verify-email?token=...
    // Here we return the token so the demo can auto-verify.
    const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/verify-email?token=${verifyToken}`;

    return NextResponse.json({
      user: { id: u.id, handle: u.handle, displayName: u.displayName, emailVerified: false },
      verifyLink,
      devToken: verifyToken, // demo only — real apps email this
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Signup failed. Try again." }, { status: 500 });
  }
}
