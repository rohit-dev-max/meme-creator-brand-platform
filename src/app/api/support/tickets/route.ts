import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { desc } from "drizzle-orm";
import { moderate } from "@/lib/moderation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const ISSUE_TYPES = ["general", "bug", "account", "battles", "brands", "translator", "ai-memes", "billing"];

export async function GET() {
  const rows = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(50);
  return NextResponse.json({
    tickets: rows.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`ticket:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many tickets — wait a minute and retry." }, { status: 429 });
    }
    const { name, email, issueType, message, userId } = await req.json();
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
    }
    if (String(message).length > 2000) {
      return NextResponse.json({ error: "Keep your message under 2000 characters." }, { status: 400 });
    }
    const mod = moderate(String(message));
    if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 400 });

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        name: String(name).slice(0, 80),
        email: String(email).slice(0, 120),
        issueType: ISSUE_TYPES.includes(issueType) ? issueType : "general",
        message: String(message).slice(0, 2000),
        userId: userId || null,
        status: "open",
      })
      .returning();
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Couldn't open ticket. Try again." }, { status: 500 });
  }
}
