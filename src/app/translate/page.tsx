"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  Copy,
  Check,
  Volume2,
  Loader2,
  Languages,
  Trash2,
  Sparkles,
} from "lucide-react";
import { LANGUAGES, langName, isRtl } from "@/lib/languages";

const MAX_CHARS = 2000;
const HISTORY_KEY = "memearena-translations";

interface HistoryItem {
  id: string;
  text: string;
  translated: string;
  source: string;
  target: string;
  tone: string;
  at: number;
}

export default function TranslatePage() {
  const [text, setText] = useState("I love memes — they turn a bad Monday into a good story.");
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("hi");
  const [tone, setTone] = useState<"none" | "formal" | "casual">("none");
  const [result, setResult] = useState("");
  const [detected, setDetected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 20);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  const translate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), source, target, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      setResult(data.translated);
      setDetected(data.source || "");
      saveHistory({
        id: `${Date.now()}`,
        text: text.trim().slice(0, 140),
        translated: data.translated.slice(0, 140),
        source: data.source || source,
        target,
        tone,
        at: Date.now(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    if (source === "auto") return;
    setSource(target);
    setTarget(source);
    setText(result || text);
    setResult(text);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const speak = () => {
    if (!result || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(result);
    u.lang = target;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const QUICK = ["I love memes", "This meeting could have been an email", "POV: prod is down", "Good morning, legends"];

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute right-1/4 top-10 h-80 w-80 rounded-full bg-teal-400/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-white">
          <ArrowLeft size={15} /> Back home
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3.5 py-1.5 text-xs font-bold text-sky-200">
              <Languages size={13} /> AI Translator · 30 languages
            </p>
            <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              MEMES SPEAK <span className="text-sky-300">EVERY LANGUAGE</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Translate any caption with auto-detect, formal/casual tone, and text-to-speech.
              Recent translations stay on your device.
            </p>
          </div>
        </div>

        {/* controls */}
        <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-[#0e0e16] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <label className="text-xs font-bold text-zinc-500">
            FROM
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm font-bold text-white outline-none focus:border-sky-300/60"
            >
              <option value="auto">✨ Auto-detect</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.native})
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={swap}
            disabled={source === "auto"}
            title={source === "auto" ? "Swap needs a fixed source language" : "Swap languages"}
            className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-sky-300/50 hover:text-sky-300 disabled:opacity-30"
          >
            <ArrowLeftRight size={17} />
          </button>
          <label className="text-xs font-bold text-zinc-500">
            TO
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm font-bold text-white outline-none focus:border-sky-300/60"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.native})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* tone */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tone:</span>
          {(["none", "formal", "casual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-bold capitalize transition ${
                tone === t ? "bg-sky-300 text-black" : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {t === "none" ? "Keep original" : t}
            </button>
          ))}
          {detected && source === "auto" && (
            <span className="ml-auto text-xs font-bold text-zinc-500">
              Detected: <span className="text-sky-300">{langName(detected)}</span>
            </span>
          )}
        </div>

        {/* boxes */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e16]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">
                {source === "auto" ? "Auto-detect" : langName(source)}
              </span>
              <span className={`text-xs font-bold ${text.length > MAX_CHARS ? "text-red-400" : "text-zinc-500"}`}>
                {text.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS + 200))}
              rows={7}
              dir={source !== "auto" && isRtl(source) ? "rtl" : "ltr"}
              placeholder="Type or paste text to translate..."
              className="w-full resize-none bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-zinc-600"
            />
            <div className="flex flex-wrap gap-1.5 border-t border-white/5 p-3">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => setText(q)}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-sky-300/20 bg-gradient-to-b from-sky-500/5 to-transparent">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-500">
                {langName(target)}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={speak}
                  disabled={!result}
                  title="Listen"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/5 transition hover:bg-white/10 disabled:opacity-30"
                >
                  <Volume2 size={15} className={speaking ? "text-sky-300" : ""} />
                </button>
                <button
                  onClick={copy}
                  disabled={!result}
                  title="Copy"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/5 transition hover:bg-white/10 disabled:opacity-30"
                >
                  {copied ? <Check size={15} className="text-lime-300" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
            <div
              dir={isRtl(target) ? "rtl" : "ltr"}
              className="min-h-[196px] p-4 text-[15px] leading-relaxed"
            >
              {loading ? (
                <span className="flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 size={16} className="animate-spin text-sky-300" /> Translating...
                </span>
              ) : result ? (
                result
              ) : (
                <span className="text-zinc-600">Translation appears here...</span>
              )}
            </div>
            {error && (
              <p className="border-t border-red-400/20 bg-red-400/5 px-4 py-2.5 text-[13px] font-bold text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={translate}
          disabled={loading || !text.trim() || text.length > MAX_CHARS}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-300 py-3.5 text-sm font-extrabold text-black transition hover:bg-sky-200 disabled:opacity-40"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
          {loading ? "Translating..." : `Translate to ${langName(target)}`}
        </button>
        <p className="mt-2 text-center text-xs text-zinc-600">
          Privacy: your text is sent to a translation service to produce the result. Nothing is stored server-side.
        </p>

        {/* history */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              Recent translations ({history.length})
            </p>
            {history.length > 0 && (
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem(HISTORY_KEY);
                }}
                className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-red-300"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
              Nothing yet — your last 20 translations will live here (on this device only).
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setText(h.text);
                    setTarget(h.target);
                    setResult(h.translated);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="block w-full rounded-2xl border border-white/5 bg-black/30 p-3 text-left transition hover:border-sky-300/30"
                >
                  <span className="block truncate text-sm font-bold">{h.text}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-sky-200/80">{h.translated}</span>
                  <span className="mt-1 block text-[11px] font-bold text-zinc-600">
                    {langName(h.source)} → {langName(h.target)} · {h.tone} · {new Date(h.at).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
