import { NextRequest, NextResponse } from "next/server";
import { generateCaptions } from "@/lib/ai-captions";
import { moderate } from "@/lib/moderation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`captions:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Slow down, speedster — try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }
    const { idea } = await req.json();
    if (!idea || typeof idea !== "string" || !idea.trim()) {
      return NextResponse.json({ error: "Give me an idea or topic first." }, { status: 400 });
    }
    if (idea.length > 200) {
      return NextResponse.json({ error: "Keep your idea under 200 characters." }, { status: 400 });
    }
    const mod = moderate(idea);
    if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 400 });

    // Simulate a beat of "thinking" for UX delight (kept short + server-side)
    await new Promise((r) => setTimeout(r, 350));

    const result = generateCaptions(idea);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Caption AI hiccup. Try again." }, { status: 500 });
  }
}
