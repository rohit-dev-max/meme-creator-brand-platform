import { NextRequest, NextResponse } from "next/server";
import { LANGUAGES } from "@/lib/languages";
import { moderate } from "@/lib/moderation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const MAX_CHARS = 2000;

// Formal/casual tone shaping applied after translation (lightweight, deterministic).
function applyTone(text: string, tone: string, target: string): string {
  if (tone === "formal") {
    let t = text.trim();
    // Capitalize sentences
    t = t.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    if (!/[.!?]$/.test(t)) t += ".";
    if (target === "en") {
      t = t
        .replace(/\bgonna\b/gi, "going to")
        .replace(/\bwanna\b/gi, "want to")
        .replace(/\bkinda\b/gi, "rather")
        .replace(/\byeah\b/gi, "yes")
        .replace(/\bbro\b/gi, "friend");
    }
    return t;
  }
  if (tone === "casual" && target === "en") {
    return text
      .replace(/\bgoing to\b/gi, "gonna")
      .replace(/\bwant to\b/gi, "wanna")
      .replace(/\bYes\b/g, "Yeah");
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`translate:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many requests — try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const { text, source, target, tone } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }
    if (text.length > MAX_CHARS) {
      return NextResponse.json({ error: `Keep it under ${MAX_CHARS} characters.` }, { status: 400 });
    }
    const mod = moderate(text);
    if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 400 });

    const valid = new Set(LANGUAGES.map((l) => l.code));
    const tgt = valid.has(target) ? target : "es";
    const src = source === "auto" ? "auto" : valid.has(source) ? source : "auto";

    // Free MyMemory translation API (no key needed). Server-side so nothing leaks.
    const q = encodeURIComponent(text.slice(0, 500));
    const langpair = encodeURIComponent(`${src === "auto" ? "en" : src}|${tgt}`);
    // If auto, let MyMemory detect via source "autodetect"? It needs a source;
    // we send en and also try detection-free fallback below.
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${src === "auto" ? `en|${tgt}` : langpair}`;

    let translated = "";
    let detected: string | undefined;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
      const data = await r.json();
      translated = data?.responseData?.translatedText ?? "";
      // MyMemory returns detected lang quirks; keep simple
      if (src === "auto" && data?.responseData?.detectedSource) {
        detected = String(data.responseData.detectedSource).toLowerCase();
      }
      // MyMemory sometimes returns "MYMEMORY WARNING" quota messages
      if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(translated)) translated = "";
    } catch {
      translated = "";
    }

    // Fallback: offline mini-dictionary for common meme phrases (works even if API is down)
    if (!translated) {
      translated = offlineFallback(text, tgt);
    }

    translated = applyTone(translated, tone === "formal" ? "formal" : tone === "casual" ? "casual" : "none", tgt);

    return NextResponse.json({
      translated,
      source: src === "auto" ? detected ?? "auto" : src,
      target: tgt,
      tone: tone ?? "none",
      provider: "mymemory",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Translation failed. Try again." }, { status: 500 });
  }
}

// Minimal offline fallback so the tool never hard-fails.
function offlineFallback(text: string, target: string): string {
  const lower = text.toLowerCase().trim();
  const dict: Record<string, Partial<Record<string, string>>> = {
    hello: { es: "hola", fr: "bonjour", de: "hallo", hi: "नमस्ते", te: "హలో", ta: "வணக்கம்", ar: "مرحبا", ja: "こんにちは", zh: "你好" },
    "good morning": { es: "buenos días", fr: "bonjour", de: "guten Morgen", hi: "सुप्रभात", te: "శుభోదయం", ta: "காலை வணக்கம்", ar: "صباح الخير", ja: "おはよう", zh: "早上好" },
    "i love memes": { es: "amo los memes", fr: "j'adore les mèmes", de: "ich liebe Memes", hi: "मुझे मीम्स पसंद हैं", te: "నాకు మీమ్స్ అంటే ఇష్టం", ta: "எனக்கு மீம்ஸ் பிடிக்கும்", ar: "أحب الميمز", ja: "ミームが大好き", zh: "我爱梗图" },
  };
  if (dict[lower]?.[target]) return dict[lower][target]!;
  // Last resort: echo with a note (still useful + honest)
  return `[${target.toUpperCase()}] ${text}`;
}
