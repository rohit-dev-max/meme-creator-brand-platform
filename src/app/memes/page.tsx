"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  Share2,
  Upload,
  Image as ImageIcon,
  Type,
  Trash2,
  Plus,
  Rocket,
  Link2,
} from "lucide-react";
import { MEME_TEMPLATES } from "@/lib/templates";
import { useCurrentUser } from "@/lib/user-context";

interface CaptionIdea {
  top: string;
  bottom: string;
  templateId: string;
  templateName: string;
  vibe: string;
}

interface Sticker {
  id: number;
  emoji: string;
  x: number; // 0-1
  y: number; // 0-1
  size: number; // px
}

interface SessionMeme {
  id: string;
  dataUrl: string;
  at: number;
}

const FONTS = [
  { id: "impact", name: "Meme Classic", css: '"Space Grotesk", Impact, sans-serif' },
  { id: "arial", name: "Bold Sans", css: '"Arial Black", Arial, sans-serif' },
  { id: "mono", name: "Terminal", css: '"Courier New", monospace' },
  { id: "serif", name: "Fancy Serif", css: 'Georgia, "Times New Roman", serif' },
  { id: "comic", name: "Playful", css: '"Comic Sans MS", "Chalkboard SE", cursive' },
];

const STICKER_PACK = ["😂", "🔥", "💀", "💯", "👑", "🚀", "⚡", "🐸", "👾", "💅", "🤡", "👀", "💸", "🏆", "💩", "❤️"];

const CANVAS_W = 800;
const CANVAS_H = 600;
const SESSION_KEY = "memearena-ai-memes";

let stickerId = 1;

export default function AiMemeMakerPage() {
  const { user } = useCurrentUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // image
  const [imageUrl, setImageUrl] = useState(MEME_TEMPLATES[0].imageUrl);
  const [templateId, setTemplateId] = useState(MEME_TEMPLATES[0].id);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  // text
  const [topText, setTopText] = useState(MEME_TEMPLATES[0].defaultTop);
  const [bottomText, setBottomText] = useState(MEME_TEMPLATES[0].defaultBottom);
  const [fontId, setFontId] = useState("impact");
  const [fontSize, setFontSize] = useState(56);
  const [textColor, setTextColor] = useState("#ffffff");
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [outlineWidth, setOutlineWidth] = useState(6);
  const [topY, setTopY] = useState(0.12);
  const [bottomY, setBottomY] = useState(0.88);

  // stickers
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // AI
  const [idea, setIdea] = useState("");
  const [ideas, setIdeas] = useState<CaptionIdea[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [recommended, setRecommended] = useState("");

  // actions
  const [copied, setCopied] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [posting, setPosting] = useState(false);
  const [postedLink, setPostedLink] = useState("");
  const [title, setTitle] = useState("");

  // session gallery
  const [gallery, setGallery] = useState<SessionMeme[]>([]);

  // drag state
  const dragRef = useRef<{ kind: "top" | "bottom" | number; dx: number; dy: number } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setGallery(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persistGallery = (g: SessionMeme[]) => {
    setGallery(g);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(g.slice(0, 12)));
    } catch { /* ignore (quota) — keep in memory only */ }
  };

  // ---- load image (CORS-safe so canvas stays exportable) ----
  useEffect(() => {
    setImgLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      imgRef.current = null;
      setImgLoaded(false);
      setActionMsg("Couldn't load that image (hotlink blocked?). Try another or upload a file.");
      setTimeout(() => setActionMsg(""), 4000);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const W = CANVAS_W;
    const H = CANVAS_H;
    ctx.clearRect(0, 0, W, H);
    // bg
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    // image cover
    const img = imgRef.current;
    if (img) {
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    }
    // subtle top/bottom shade for readability
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0.35)");
    grad.addColorStop(0.25, "rgba(0,0,0,0)");
    grad.addColorStop(0.75, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const font = FONTS.find((f) => f.id === fontId)?.css ?? FONTS[0].css;
    const drawMemeText = (text: string, yRatio: number) => {
      if (!text.trim()) return;
      const size = fontSize;
      ctx.font = `700 ${size}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // wrap
      const words = text.toUpperCase().split(/\s+/);
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > W - 60 && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      const lineH = size * 1.08;
      const startY = yRatio * H - ((lines.length - 1) * lineH) / 2;
      lines.forEach((ln, i) => {
        const y = startY + i * lineH;
        ctx.lineJoin = "round";
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.strokeText(ln, W / 2, y);
        ctx.fillStyle = textColor;
        ctx.fillText(ln, W / 2, y);
      });
    };
    drawMemeText(topText, topY);
    drawMemeText(bottomText, bottomY);

    // stickers
    for (const s of stickers) {
      ctx.font = `${s.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, s.x * W, s.y * H);
    }
  }, [topText, bottomText, fontId, fontSize, textColor, outlineColor, outlineWidth, topY, bottomY, stickers, imgLoaded]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---- drag text + stickers on canvas ----
  const canvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (cx - rect.left) / rect.width, y: (cy - rect.top) / rect.height };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const p = canvasPos(e);
    // sticker hit first (radius ~ size)
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      const r = s.size / CANVAS_W + 0.03;
      if (Math.abs(p.x - s.x) < r && Math.abs(p.y - s.y * (CANVAS_H / CANVAS_W) - 0) < r + 0.04) {
        dragRef.current = { kind: s.id, dx: p.x - s.x, dy: p.y - s.y };
        return;
      }
    }
    if (Math.abs(p.y - topY) < 0.14) dragRef.current = { kind: "top", dx: 0, dy: p.y - topY };
    else if (Math.abs(p.y - bottomY) < 0.14) dragRef.current = { kind: "bottom", dx: 0, dy: p.y - bottomY };
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (e.cancelable && "touches" in e) e.preventDefault();
    const p = canvasPos(e);
    if (d.kind === "top") setTopY(Math.min(0.45, Math.max(0.04, p.y - d.dy)));
    else if (d.kind === "bottom") setBottomY(Math.min(0.97, Math.max(0.55, p.y - d.dy)));
    else {
      const id = d.kind as number;
      setStickers((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, x: Math.min(0.98, Math.max(0.02, p.x - d.dx)), y: Math.min(0.98, Math.max(0.02, p.y - d.dy)) }
            : s
        )
      );
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // ---- AI captions ----
  const generate = async () => {
    if (!idea.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed");
      setIdeas(data.ideas);
      setRecommended(data.recommendedTemplateId);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setAiLoading(false);
    }
  };

  const applyIdea = (c: CaptionIdea) => {
    setTopText(c.top);
    setBottomText(c.bottom);
    const tpl = MEME_TEMPLATES.find((t) => t.id === c.templateId);
    if (tpl) {
      setImageUrl(tpl.imageUrl);
      setTemplateId(tpl.id);
    }
    if (!title.trim()) setTitle(idea.trim() ? `${idea.trim().slice(0, 60)}` : "AI-generated banger");
  };

  const applyRecommended = () => {
    const tpl = MEME_TEMPLATES.find((t) => t.id === recommended);
    if (tpl) {
      setImageUrl(tpl.imageUrl);
      setTemplateId(tpl.id);
    }
  };

  // ---- export ----
  const snapshot = (): string | null => {
    draw();
    try {
      return canvasRef.current?.toDataURL("image/png") ?? null;
    } catch {
      setActionMsg("Export blocked by image CORS — upload your own image file to enable download.");
      setTimeout(() => setActionMsg(""), 5000);
      return null;
    }
  };

  const saveToGallery = (dataUrl: string) => {
    const item = { id: `${Date.now()}`, dataUrl, at: Date.now() };
    persistGallery([item, ...gallery].slice(0, 12));
  };

  const download = () => {
    const url = snapshot();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `memearena-${Date.now()}.png`;
    a.click();
    saveToGallery(url);
    setActionMsg("Downloaded PNG + saved to your session gallery 🎉");
    setTimeout(() => setActionMsg(""), 3000);
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("no blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      const url = snapshot();
      if (url) saveToGallery(url);
    } catch {
      setActionMsg("Copy blocked by browser — use Download PNG instead.");
      setTimeout(() => setActionMsg(""), 4000);
    }
  };

  const postToFeed = async () => {
    if (!user) {
      setActionMsg("Pick a persona in the header to post.");
      setTimeout(() => setActionMsg(""), 3000);
      return;
    }
    const dataUrl = snapshot();
    if (!dataUrl) return;
    // downscale dataURL for DB sanity: draw to small canvas
    const small = document.createElement("canvas");
    small.width = 640;
    small.height = 480;
    const sctx = small.getContext("2d");
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => {
      img.onload = res;
    });
    sctx?.drawImage(img, 0, 0, 640, 480);
    const jpeg = small.toDataURL("image/jpeg", 0.82);

    setPosting(true);
    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim() || idea.trim() || "AI-generated banger",
          imageUrl: templateId === "upload" || templateId === "custom" ? jpeg : imageUrl,
          topText,
          bottomText,
          tags: "ai-made,memes",
          template: templateId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Post failed");
      const link = `${window.location.origin}/meme/${data.meme.id}`;
      setPostedLink(link);
      try {
        await navigator.clipboard.writeText(link);
      } catch { /* ignore */ }
      saveToGallery(dataUrl);
      setActionMsg("Posted to feed + link copied! (+50 XP) 🚀");
      setTimeout(() => setActionMsg(""), 4000);
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Post failed");
      setTimeout(() => setActionMsg(""), 4000);
    } finally {
      setPosting(false);
    }
  };

  // ---- image sources ----
  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setActionMsg("That's not an image file.");
      setTimeout(() => setActionMsg(""), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(String(reader.result));
      setTemplateId("upload");
    };
    reader.readAsDataURL(f);
  };

  const useCustomUrl = () => {
    if (!customUrl.trim()) return;
    setImageUrl(customUrl.trim());
    setTemplateId("custom");
  };

  const IDEA_PRESETS = ["monday meetings", "my cat at 3am", "wifi goes down", "gym in january", "group project"];

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute right-1/4 top-10 h-80 w-80 rounded-full bg-violet-500/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-white">
          <ArrowLeft size={15} /> Back home
        </Link>

        <div className="mt-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3.5 py-1.5 text-xs font-bold text-fuchsia-200">
            <Bot size={13} /> Built-in AI Meme Maker · no key needed
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            TYPE AN IDEA. <span className="text-fuchsia-300">GET A BANGER.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Our built-in AI writes 5 funny captions and picks a template for any topic. Then remix it
            on canvas — drag text anywhere, restyle fonts, slap on stickers, and export.
          </p>
        </div>

        {/* AI box */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-gradient-to-b from-fuchsia-500/10 to-transparent p-5">
          <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-zinc-300">
            <Sparkles size={14} className="text-fuchsia-300" /> Step 1 — Generate with AI
          </p>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="e.g. monday meetings, my cat judging me, wifi going down..."
              maxLength={200}
              className="flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-fuchsia-400/60"
            />
            <button
              onClick={generate}
              disabled={aiLoading || !idea.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-fuchsia-400 px-6 py-3 text-sm font-extrabold text-black transition hover:bg-fuchsia-300 disabled:opacity-40"
            >
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
              {aiLoading ? "Cooking..." : "Generate 5 captions"}
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {IDEA_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setIdea(p)}
                className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                {p}
              </button>
            ))}
          </div>
          {aiError && <p className="mt-2.5 text-sm font-bold text-red-300">{aiError}</p>}
          {ideas.length > 0 && (
            <div className="animate-pop mt-4">
              {recommended && (
                <button
                  onClick={applyRecommended}
                  className="mb-2.5 flex items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3.5 py-1.5 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-400/20"
                >
                  <ImageIcon size={13} /> AI recommends: {MEME_TEMPLATES.find((t) => t.id === recommended)?.name} — apply it
                </button>
              )}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ideas.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => applyIdea(c)}
                    className="group rounded-2xl border border-white/10 bg-black/40 p-3.5 text-left transition hover:border-fuchsia-400/50 hover:bg-fuchsia-400/5"
                  >
                    <span className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                      <span>Option {i + 1} · {c.vibe}</span>
                      <Plus size={13} className="text-fuchsia-300 opacity-0 transition group-hover:opacity-100" />
                    </span>
                    <span className="mt-1.5 block text-[13px] font-extrabold leading-snug">{c.top}</span>
                    <span className="mt-0.5 block text-[13px] font-extrabold leading-snug text-fuchsia-200">{c.bottom}</span>
                    <span className="mt-1.5 block text-[11px] text-zinc-500">📷 {c.templateName} · click to apply</span>
                  </button>
                ))}
                <div className="flex flex-col justify-center rounded-2xl border border-dashed border-white/15 p-3.5 text-center">
                  <p className="text-[13px] font-bold text-zinc-400">Not feeling these?</p>
                  <button onClick={generate} className="mt-1.5 text-[13px] font-bold text-fuchsia-300 hover:underline">
                    ↻ Regenerate for “{idea.slice(0, 30)}”
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* Canvas */}
          <div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e16]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">
                  <Type size={12} className="mr-1 inline" /> Canvas editor — drag text & stickers
                </p>
                <span className={`text-xs font-bold ${imgLoaded ? "text-lime-300" : "text-amber-300"}`}>
                  {imgLoaded ? "● ready" : "○ loading image..."}
                </span>
              </div>
              <div className="bg-black p-3">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  onMouseDown={onPointerDown}
                  onMouseMove={onPointerMove}
                  onMouseUp={onPointerUp}
                  onMouseLeave={onPointerUp}
                  onTouchStart={onPointerDown}
                  onTouchMove={onPointerMove}
                  onTouchEnd={onPointerUp}
                  className="w-full cursor-move touch-none select-none rounded-2xl border border-white/10"
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <label className="text-xs font-bold text-zinc-500">
                    TOP TEXT
                    <input
                      value={topText}
                      onChange={(e) => setTopText(e.target.value.toUpperCase())}
                      maxLength={80}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm font-bold outline-none focus:border-fuchsia-400/60"
                    />
                  </label>
                  <label className="text-xs font-bold text-zinc-500">
                    BOTTOM TEXT
                    <input
                      value={bottomText}
                      onChange={(e) => setBottomText(e.target.value.toUpperCase())}
                      maxLength={80}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm font-bold outline-none focus:border-fuchsia-400/60"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <label className="text-xs font-bold text-zinc-500">
                    FONT
                    <select
                      value={fontId}
                      onChange={(e) => setFontId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-2.5 py-2 text-[13px] font-bold text-white outline-none"
                    >
                      {FONTS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-zinc-500">
                    SIZE · {fontSize}px
                    <input
                      type="range"
                      min={28}
                      max={96}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="mt-2.5 w-full accent-fuchsia-400"
                    />
                  </label>
                  <label className="text-xs font-bold text-zinc-500">
                    TEXT
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="mt-1 h-9 w-full cursor-pointer rounded-xl border border-white/10 bg-black/50"
                    />
                  </label>
                  <label className="text-xs font-bold text-zinc-500">
                    OUTLINE · {outlineWidth}px
                    <span className="mt-1 flex gap-1.5">
                      <input
                        type="color"
                        value={outlineColor}
                        onChange={(e) => setOutlineColor(e.target.value)}
                        className="h-9 w-10 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-black/50"
                      />
                      <input
                        type="range"
                        min={0}
                        max={12}
                        value={outlineWidth}
                        onChange={(e) => setOutlineWidth(Number(e.target.value))}
                        className="w-full accent-fuchsia-400"
                      />
                    </span>
                  </label>
                </div>
                {/* stickers */}
                <div>
                  <p className="text-xs font-bold text-zinc-500">
                    STICKERS · click to add, drag on canvas
                    {stickers.length > 0 && (
                      <button onClick={() => setStickers([])} className="ml-2 font-bold text-red-300 hover:underline">
                        clear all
                      </button>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {STICKER_PACK.map((em) => (
                      <button
                        key={em}
                        onClick={() => setStickers((p) => [...p, { id: stickerId++, emoji: em, x: 0.5, y: 0.5, size: 72 }])}
                        className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-xl transition hover:scale-110 hover:bg-white/10"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  {stickers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {stickers.map((s) => (
                        <span key={s.id} className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-xs">
                          {s.emoji}
                          <button
                            onClick={() => setStickers((p) => p.map((x) => (x.id === s.id ? { ...x, size: Math.min(160, x.size + 12) } : x)))}
                            className="font-bold text-zinc-400 hover:text-white"
                          >
                            +
                          </button>
                          <button
                            onClick={() => setStickers((p) => p.map((x) => (x.id === s.id ? { ...x, size: Math.max(24, x.size - 12) } : x)))}
                            className="font-bold text-zinc-400 hover:text-white"
                          >
                            −
                          </button>
                          <button onClick={() => setStickers((p) => p.filter((x) => x.id !== s.id))} className="text-red-300">
                            <Trash2 size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* export row */}
            <div className="mt-4 rounded-3xl border border-white/10 bg-[#0e0e16] p-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title (for feed + share link)..."
                maxLength={120}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-fuchsia-400/60"
              />
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  onClick={download}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-fuchsia-400 py-2.5 text-[13px] font-extrabold text-black hover:bg-fuchsia-300"
                >
                  <Download size={15} /> PNG
                </button>
                <button
                  onClick={copyImage}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/10 py-2.5 text-[13px] font-bold hover:bg-white/15"
                >
                  {copied ? <Check size={15} className="text-lime-300" /> : <Copy size={15} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={postToFeed}
                  disabled={posting || !imgLoaded}
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-2xl bg-lime-300 py-2.5 text-[13px] font-extrabold text-black hover:bg-lime-200 disabled:opacity-40"
                >
                  {posting ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                  {posting ? "Posting..." : "Post to feed + copy share link"}
                </button>
              </div>
              {actionMsg && <p className="mt-2 text-center text-[13px] font-bold text-lime-300">{actionMsg}</p>}
              {postedLink && (
                <a
                  href={postedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl border border-lime-300/30 bg-lime-300/5 py-2 text-[13px] font-bold text-lime-300 hover:underline"
                >
                  <Link2 size={13} /> {postedLink} <Share2 size={13} />
                </a>
              )}
              <p className="mt-2 text-center text-[11px] text-zinc-600">
                AI image generation from prompt — coming soon. Today the AI writes captions; you bring the pixels.
              </p>
            </div>
          </div>

          {/* RIGHT: templates + gallery */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-4">
              <p className="text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
                Step 2 — Pick or upload image
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                {MEME_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setImageUrl(t.imageUrl);
                      setTemplateId(t.id);
                      setTopText(t.defaultTop);
                      setBottomText(t.defaultBottom);
                    }}
                    title={t.name}
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      templateId === t.id ? "border-fuchsia-400" : "border-transparent hover:border-white/25"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.imageUrl} alt={t.name} className="aspect-square w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/20 py-2.5 text-[13px] font-bold text-zinc-300 hover:border-fuchsia-400/50 hover:text-white"
              >
                <Upload size={14} /> Upload my own image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <div className="mt-2 flex gap-1.5">
                <input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="...or paste image URL"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[13px] outline-none placeholder:text-zinc-600"
                />
                <button
                  onClick={useCustomUrl}
                  className="shrink-0 rounded-xl bg-white/10 px-3.5 py-2 text-[13px] font-bold hover:bg-white/15"
                >
                  Use
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-4">
              <p className="text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
                Session gallery ({gallery.length})
              </p>
              {gallery.length === 0 ? (
                <p className="mt-2.5 rounded-2xl border border-dashed border-white/10 p-4 text-center text-[13px] text-zinc-500">
                  Memes you download, copy, or post will appear here for this session.
                </p>
              ) : (
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {gallery.map((g) => (
                    <a key={g.id} href={g.dataUrl} download={`meme-${g.id}.png`} title="Click to download">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.dataUrl} alt="AI meme" className="aspect-[4/3] w-full rounded-xl border border-white/10 object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-4 text-[12px] leading-relaxed text-zinc-500">
              <p className="font-bold text-zinc-300">House rules for the AI 🤖</p>
              <p className="mt-1">
                The caption AI refuses hateful, sexual, or harassing ideas. Keep it fun, keep it kind —
                the best memes punch up, not down.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
