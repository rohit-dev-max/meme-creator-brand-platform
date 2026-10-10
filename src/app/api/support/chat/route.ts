import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/support-data";
import { moderate } from "@/lib/moderation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Support chatbot: built-in knowledge base, replies in the user's language.
// POST { message, language } — history is kept client-side during the session.

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`chat:${ip}`, 40, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Whoa, slow down — try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }
    const { message, language } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "Keep messages under 1000 characters." }, { status: 400 });
    }
    const mod = moderate(message);
    if (!mod.ok) return NextResponse.json({ reply: mod.reason, moderated: true });

    let reply = answerQuestion(message.trim());
    const lang = typeof language === "string" ? language : "en";

    // Reply in the user's language via server-side translation (best-effort)
    if (lang && lang !== "en") {
      try {
        const q = encodeURIComponent(reply.slice(0, 450));
        const r = await fetch(
          `https://api.mymemory.translated.net/get?q=${q}&langpair=en|${encodeURIComponent(lang)}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const data = await r.json();
        const t = data?.responseData?.translatedText as string | undefined;
        if (t && !/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(t)) reply = t;
      } catch {
        // keep English reply on failure
      }
    }

    return NextResponse.json({ reply, language: lang || "en" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Chat failed. Try again." }, { status: 500 });
  }
}
