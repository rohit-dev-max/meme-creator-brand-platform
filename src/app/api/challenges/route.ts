import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const list = await db.select().from(challenges).orderBy(desc(challenges.endsAt));
  return NextResponse.json({
    challenges: list.map((c) => ({
      ...c,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, prize, prizePool, endsAt, rules, sponsorName, sponsorEmoji, status } = body;
    if (!title || !description) return NextResponse.json({ error: "title+description required" }, { status: 400 });
    const gradients = [
      "from-lime-400 to-emerald-500",
      "from-fuchsia-500 to-purple-600",
      "from-amber-300 to-orange-500",
      "from-sky-400 to-indigo-600",
      "from-rose-400 to-red-600",
    ];
    const [c] = await db
      .insert(challenges)
      .values({
        title: String(title).slice(0, 100),
        description: String(description).slice(0, 2000),
        prize: String(prize ?? "$500").slice(0, 40),
        prizePool: Number(prizePool ?? 500),
        endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 7 * 86400000),
        rules: String(rules ?? "").slice(0, 2000),
        sponsorName: String(sponsorName ?? "MemeArena").slice(0, 60),
        sponsorEmoji: String(sponsorEmoji ?? "🏆").slice(0, 8),
        status: status ?? "live",
        coverGradient: gradients[Math.floor(Math.random() * gradients.length)],
      })
      .returning();
    return NextResponse.json({ challenge: c }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
