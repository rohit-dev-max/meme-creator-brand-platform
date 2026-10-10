"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LifeBuoy,
  Search,
  ChevronDown,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  Check,
  Phone,
} from "lucide-react";
import { FAQS, FAQ_CATEGORIES } from "@/lib/support-data";
import { LANGUAGES } from "@/lib/languages";
import { useCurrentUser } from "@/lib/user-context";

interface Msg {
  role: "user" | "bot";
  text: string;
}

const ISSUE_TYPES = [
  { id: "general", label: "General question" },
  { id: "bug", label: "Bug report" },
  { id: "account", label: "Account / persona" },
  { id: "battles", label: "Battles" },
  { id: "brands", label: "Brand deals" },
  { id: "translator", label: "Translator" },
  { id: "ai-memes", label: "AI Meme Maker" },
  { id: "billing", label: "Payments / prizes" },
];

export default function HelpPage() {
  const { user } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<string | null>("start-1");

  // chatbot
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hey! I'm ArenaBot 👋 — ask me anything about posting memes, battles, brand deals, the translator, or the AI Meme Maker. I reply in your language!",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLang, setChatLang] = useState("en");
  const bottomRef = useRef<HTMLDivElement>(null);

  // ticket form
  const [form, setForm] = useState({ name: "", email: "", issueType: "general", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const filtered = FAQS.filter(
    (f) =>
      (category === "All" || f.category === category) &&
      (!query.trim() ||
        f.q.toLowerCase().includes(query.toLowerCase()) ||
        f.a.toLowerCase().includes(query.toLowerCase()))
  );

  const sendChat = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || chatLoading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    // "talk to human" shortcut
    if (/human|agent|person|ticket/i.test(text)) {
      setMsgs((m) => [
        ...m,
        { role: "bot", text: "Of course — connecting you to a human! 🎧 I've opened the contact form below. Fill it in and the team replies within 24h." },
      ]);
      setShowForm(true);
      document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setChatLoading(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: chatLang }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "bot", text: data.reply || data.error || "Hmm, try again!" }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Connection hiccup — try again in a sec! 🔄" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const submitTicket = async () => {
    setFormError("");
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormError("Name, email, and message are required.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSent(true);
      setForm({ name: "", email: "", issueType: "general", message: "" });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't send ticket");
    } finally {
      setSending(false);
    }
  };

  const QUICK = ["How do I post a meme?", "How do battles work?", "How do brand deals work?", "Talk to a human"];

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-80 w-80 rounded-full bg-emerald-400/15 blur-[120px]" />
        <div className="absolute right-1/3 top-10 h-80 w-80 rounded-full bg-sky-500/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-white">
          <ArrowLeft size={15} /> Back home
        </Link>

        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3.5 py-1.5 text-xs font-bold text-emerald-200">
          <LifeBuoy size={13} /> Help & Customer Service
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          WE GOT <span className="text-emerald-300">YOU.</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Chat with ArenaBot for instant answers, search the FAQ, or open a ticket and talk to a human.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_400px]">
          {/* LEFT: FAQ + form */}
          <div className="space-y-5">
            {/* FAQ search */}
            <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2.5">
                <Search size={15} className="text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help articles..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
                />
              </div>
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {FAQ_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      category === c ? "bg-white text-black" : "bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {filtered.map((f) => {
                  const open = openFaq === f.id;
                  return (
                    <div key={f.id} className={`overflow-hidden rounded-2xl border transition ${open ? "border-emerald-300/40 bg-emerald-300/5" : "border-white/10 bg-black/30"}`}>
                      <button
                        onClick={() => setOpenFaq(open ? null : f.id)}
                        className="flex w-full items-center gap-3 p-3.5 text-left"
                      >
                        <span className="flex-1 text-sm font-bold">{f.q}</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-zinc-500">{f.category}</span>
                        <ChevronDown size={16} className={`shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
                      </button>
                      {open && <p className="px-3.5 pb-4 text-sm leading-relaxed text-zinc-300">{f.a}</p>}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">
                    No articles match “{query}” — try the chatbot or open a ticket below.
                  </p>
                )}
              </div>
            </div>

            {/* Contact form */}
            <div id="contact-form" className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg font-bold">📩 Contact support</p>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold hover:bg-white/15"
                >
                  <Phone size={13} /> {showForm ? "Hide form" : "Talk to a human"}
                </button>
              </div>
              {showForm || sent ? (
                sent ? (
                  <div className="animate-pop mt-4 rounded-2xl border border-lime-300/30 bg-lime-300/5 p-6 text-center">
                    <Check size={28} className="mx-auto text-lime-300" />
                    <p className="font-display mt-2 text-lg font-bold">Ticket received!</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Thanks — a human will reply within 24 hours. Ticket saved and visible to the support team.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-3 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold"
                    >
                      Open another ticket
                    </button>
                  </div>
                ) : (
                  <div className="animate-pop mt-4 grid gap-3 sm:grid-cols-2">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-300/60"
                    />
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email address"
                      type="email"
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-300/60"
                    />
                    <select
                      value={form.issueType}
                      onChange={(e) => setForm({ ...form, issueType: e.target.value })}
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-300/60 sm:col-span-2"
                    >
                      {ISSUE_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      maxLength={2000}
                      placeholder="Describe your issue..."
                      className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-300/60 sm:col-span-2"
                    />
                    {formError && <p className="text-sm font-bold text-red-300 sm:col-span-2">{formError}</p>}
                    <button
                      onClick={submitTicket}
                      disabled={sending}
                      className="rounded-full bg-emerald-300 py-2.5 text-sm font-extrabold text-black disabled:opacity-40 sm:col-span-2"
                    >
                      {sending ? "Sending..." : "Send support ticket"}
                    </button>
                  </div>
                )
              ) : (
                <p className="mt-3 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
                  Prefer humans? Click “Talk to a human” and we&apos;ll open the ticket form.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: chatbot */}
          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl border border-emerald-300/20 bg-[#0e0e16]">
              <div className="flex items-center gap-3 border-b border-white/10 bg-black/30 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-xl text-black">
                  <Bot size={20} />
                </span>
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-extrabold">
                    ArenaBot
                    <span className="flex items-center gap-1 rounded-full bg-lime-300/15 px-2 py-0.5 text-[10px] font-bold text-lime-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" /> online
                    </span>
                  </p>
                  <p className="text-[11px] text-zinc-500">Replies instantly · history kept this session</p>
                </div>
                <select
                  value={chatLang}
                  onChange={(e) => setChatLang(e.target.value)}
                  title="Bot reply language"
                  className="w-24 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs font-bold outline-none"
                >
                  {LANGUAGES.slice(0, 15).map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "bot" && (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-300/20 text-emerald-300">
                        <Bot size={14} />
                      </span>
                    )}
                    <p
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        m.role === "user"
                          ? "rounded-br-md bg-emerald-300 font-medium text-black"
                          : "rounded-bl-md border border-white/10 bg-black/40 text-zinc-200"
                      }`}
                    >
                      {m.text}
                    </p>
                    {m.role === "user" && (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-zinc-300">
                        <UserIcon size={14} />
                      </span>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-300/20 text-emerald-300">
                      <Bot size={14} />
                    </span>
                    <p className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-black/40 px-3.5 py-2.5 text-[13px] text-zinc-400">
                      <Loader2 size={14} className="animate-spin" /> typing...
                    </p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-white/10 p-3">
                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendChat(q)}
                      className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Ask anything..."
                    maxLength={1000}
                    className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-300/60"
                  />
                  <button
                    onClick={() => sendChat()}
                    disabled={chatLoading || !input.trim()}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-300 text-black disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
