import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

const AVATARS = ["🔥", "😹", "💀", "🐸", "🤡", "👾", "🧠", "🚀", "⚡", "🎭", "🐱", "🦍"];
const COLORS = ["#a3e635", "#e879f9", "#22d3ee", "#fbbf24", "#fb7185", "#818cf8", "#34d399", "#f97316"];

export async function GET() {
  const list = await db.select().from(users).orderBy(desc(users.xp));
  return NextResponse.json({ users: list });
}

export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });

    const body = await req.json();
    const { handle, displayName, role, bio } = body;
    if (!handle || !displayName) {
      return NextResponse.json({ error: "handle and displayName required" }, { status: 400 });
    }
    const clean = String(handle).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    if (!clean) return NextResponse.json({ error: "invalid handle" }, { status: 400 });
    const emoji = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const [created] = await db
      .insert(users)
      .values({
        handle: clean,
        displayName: String(displayName).slice(0, 40),
        avatarEmoji: emoji,
        avatarColor: color,
        role: role === "brand" ? "brand" : "memer",
        bio: bio ? String(bio).slice(0, 280) : "Fresh memer in the Arena 🫡",
        xp: 50,
        level: 1,
      })
      .returning();
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "failed";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "handle already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "failed to create user" }, { status: 500 });
  }
}
