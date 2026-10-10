"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Hammer,
  Image as ImageIcon,
  Type,
  Tag,
  Swords,
  Rocket,
  Shuffle,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import MemeImage from "@/components/MemeImage";
import { MEME_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { useCurrentUser } from "@/lib/user-context";

const CAPTION_IDEAS = [
  ["POV: MONDAY 9AM", "ME: ALREADY DONE"],
  ["NOBODY:", "ABSOLUTELY NOBODY:", "ME AT 3AM:"],
  ["EXPECTATION", "REALITY"],
  ["MY LAST BRAINCELL", "WATCHING ME MAKE DECISIONS"],
  ["BOSS: WE'RE A FAMILY", "ME: I WANT A DIVORCE"],
  ["ME: I'LL SLEEP EARLY", "ALSO ME AT 3AM:"],
  ["CLIENT: SMALL CHANGE", "THE SMALL CHANGE:"],
  ["MY BANK ACCOUNT", "AFTER PAYDAY (2 HOURS LATER)"],
];

export default function CreatePage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [topText, setTopText] = useState(MEME_TEMPLATES[0].defaultTop);
  const [bottomText, setBottomText] = useState(MEME_TEMPLATES[0].defaultBottom);
  const [tags, setTags] = useState("funny,relatable");
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
  const [customUrl, setCustomUrl] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [category, setCategory] = useState("All");
  const [challenges, setChallenges] = useState<any[]>([]);
  const [challengeId, setChallengeId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((d) => setChallenges((d.challenges ?? []).filter((c: any) => c.status === "live")));
  }, []);

  const imageUrl = useCustom && customUrl ? customUrl : selectedTemplate.imageUrl;

  const shuffleCaption = () => {
    const pick = CAPTION_IDEAS[Math.floor(Math.random() * CAPTION_IDEAS.length)];
    setTopText(pick[0] ?? "");
    setBottomText(pick[1] ?? "");
  };

  const publish = async () => {
    if (!user || !title.trim() || !imageUrl) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim(),
          imageUrl,
          topText,
          bottomText,
          tags,
          template: useCustom ? "custom" : selectedTemplate.id,
          challengeId: challengeId || undefined,
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/"), 1400);
      }
    } finally {
      setPublishing(false);
    }
  };

  const filtered =
    category === "All" ? MEME_TEMPLATES : MEME_TEMPLATES.filter((t) => t.category === category);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-white">
        <ArrowLeft size={15} /> Back to feed
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display flex items-center gap-2.5 text-4xl font-bold tracking-tight">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 text-black">
              <Hammer size={22} />
            </span>
            Meme Studio
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Pick a template, write a banger caption, post it — earn <span className="font-bold text-lime-300">+50 XP</span> instantly.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* LEFT: editor */}
        <div className="space-y-5">
          {/* step 1 */}
          <section className="rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
            <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-lime-300 text-[12px] font-black text-black">1</span>
              <ImageIcon size={14} className="text-lime-300" /> Pick a template
            </p>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {TEMPLATE_CATEGORIES.map((c) => (
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
            <div className="scrollbar-thin mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t);
                    setUseCustom(false);
                    setTopText(t.defaultTop);
                    setBottomText(t.defaultBottom);
                  }}
                  className={`group relative overflow-hidden rounded-2xl border-2 text-left transition ${
                    !useCustom && selectedTemplate.id === t.id
                      ? "border-lime-300"
                      : "border-transparent hover:border-white/25"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageUrl} alt={t.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-bold">
                    {t.name}
                  </span>
                  {!useCustom && selectedTemplate.id === t.id && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-lime-300 text-black">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-black/30 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="h-4 w-4 accent-lime-300"
                />
                Use my own image URL
              </label>
              {useCustom && (
                <input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://... (paste any image link)"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                />
              )}
            </div>
          </section>

          {/* step 2 */}
          <section className="rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
            <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-fuchsia-400 text-[12px] font-black text-black">2</span>
              <Type size={14} className="text-fuchsia-300" /> Write the banger
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-500">POST TITLE</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. POV: standup in 5 minutes and you did nothing"
                  maxLength={120}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500">TOP TEXT</label>
                    <button onClick={shuffleCaption} className="flex items-center gap-1 text-[11px] font-bold text-lime-300 hover:underline">
                      <Shuffle size={11} /> Inspire me
                    </button>
                  </div>
                  <input
                    value={topText}
                    onChange={(e) => setTopText(e.target.value.toUpperCase())}
                    maxLength={80}
                    className="meme-text mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm !text-white outline-none focus:border-lime-300/60"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500">BOTTOM TEXT</label>
                  <input
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value.toUpperCase())}
                    maxLength={80}
                    className="meme-text mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm !text-white outline-none focus:border-lime-300/60"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                  <Tag size={12} /> TAGS (comma separated)
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="funny, relatable, work"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                />
              </div>
            </div>
          </section>

          {/* step 3 */}
          <section className="rounded-3xl border border-fuchsia-400/20 bg-gradient-to-b from-fuchsia-500/5 to-transparent p-5">
            <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-zinc-300">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[12px] font-black text-black">3</span>
              <Swords size={14} className="text-fuchsia-300" /> Enter a battle? (optional, +75 XP)
            </p>
            <div className="mt-3 grid gap-2">
              <button
                onClick={() => setChallengeId("")}
                className={`rounded-2xl border p-3 text-left text-sm font-bold transition ${
                  challengeId === "" ? "border-lime-300/60 bg-lime-300/10" : "border-white/10 bg-black/30 hover:border-white/25"
                }`}
              >
                Just post to feed
              </button>
              {challenges.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChallengeId(c.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    challengeId === c.id ? "border-fuchsia-400/60 bg-fuchsia-400/10" : "border-white/10 bg-black/30 hover:border-white/25"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    {c.sponsorEmoji} {c.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    Prize: <span className="font-bold text-fuchsia-300">{c.prize}</span> · {c.entryCount} entries
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT: preview */}
        <div>
          <div className="sticky top-[120px] overflow-hidden rounded-3xl border border-white/10 bg-[#101019]">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3">
              <p className="text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">Live preview</p>
              <span className="flex items-center gap-1.5 text-xs font-bold text-lime-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" /> {user ? `@${user.handle}` : "anon"}
              </span>
            </div>
            <div className="p-4">
              <p className="font-display text-[17px] font-bold leading-snug">
                {title || <span className="text-zinc-600">Your hilarious title appears here...</span>}
              </p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                {imageUrl ? (
                  <MemeImage imageUrl={imageUrl} topText={topText} bottomText={bottomText} title={title || "preview"} />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center bg-black/50 text-sm text-zinc-500">
                    Paste an image URL to preview
                  </div>
                )}
              </div>
              {tags && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5).map((t) => (
                    <span key={t} className="text-xs font-semibold text-zinc-500">#{t}</span>
                  ))}
                </div>
              )}
              <button
                onClick={publish}
                disabled={publishing || done || !title.trim() || !imageUrl || !user}
                className="glow-lime mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 py-3.5 text-sm font-extrabold text-black transition hover:bg-lime-200 disabled:opacity-40"
              >
                {done ? (
                  <><Check size={17} strokeWidth={3} /> Posted! Taking you to feed...</>
                ) : publishing ? (
                  <><Loader2 size={17} className="animate-spin" /> Posting...</>
                ) : (
                  <><Rocket size={17} /> Post meme {challengeId ? "+ enter battle" : ""}</>
                )}
              </button>
              {!user && <p className="mt-2 text-center text-xs text-zinc-500">Pick a persona in the header to post.</p>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-zinc-500">
                <div className="rounded-xl bg-white/5 p-2">+50 XP<br /><span className="text-zinc-600">per post</span></div>
                <div className="rounded-xl bg-white/5 p-2">+5 XP<br /><span className="text-zinc-600">per upvote</span></div>
                <div className="rounded-xl bg-white/5 p-2">+75 XP<br /><span className="text-zinc-600">battle entry</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
