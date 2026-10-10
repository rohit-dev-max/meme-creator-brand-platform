"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowBigUp,
  ArrowBigDown,
  Eye,
  BadgeCheck,
  Share2,
  Send,
  Loader2,
  Flame,
} from "lucide-react";
import MemeImage from "@/components/MemeImage";
import MemeCard, { MemeWithUser } from "@/components/MemeCard";
import { useCurrentUser, timeAgo, formatNumber } from "@/lib/user-context";

export default function MemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [meme, setMeme] = useState<(MemeWithUser & { bio?: string; level?: number; xp?: number }) | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [more, setMore] = useState<MemeWithUser[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState(0);
  const [score, setScore] = useState(0);
  const [voting, setVoting] = useState(false);
  const [shared, setShared] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = user ? `?viewerId=${user.id}` : "";
      const res = await fetch(`/api/memes/${id}${params}`);
      const data = await res.json();
      if (data.meme) {
        setMeme(data.meme);
        setVote(data.meme.userVote ?? 0);
        setScore(data.meme.score);
      }
      const c = await fetch(`/api/comments?memeId=${id}`).then((r) => r.json());
      setComments(c.comments ?? []);
      const m = await fetch(`/api/memes?sort=hot&limit=6${user ? `&viewerId=${user.id}` : ""}`).then((r) =>
        r.json()
      );
      setMore(((m.memes ?? []) as MemeWithUser[]).filter((x) => x.id !== id).slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const doVote = async (value: number) => {
    if (!user || voting || !meme) return;
    setVoting(true);
    const prevVote = vote;
    const prevScore = score;
    let nextVote = value;
    let delta = value;
    if (prevVote === value) {
      nextVote = 0;
      delta = -value;
    } else if (prevVote !== 0) {
      delta = value * 2;
    }
    setVote(nextVote);
    setScore(prevScore + delta);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memeId: id, userId: user.id, value: nextVote }),
      });
      const data = await res.json();
      setScore(data.score);
      setVote(data.userVote ?? nextVote);
    } catch {
      setVote(prevVote);
      setScore(prevScore);
    } finally {
      setVoting(false);
    }
  };

  const send = async () => {
    if (!user || !body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memeId: id, userId: user.id, body: body.trim() }),
      });
      if (res.ok) {
        setBody("");
        const c = await fetch(`/api/comments?memeId=${id}`).then((r) => r.json());
        setComments(c.comments ?? []);
      }
    } finally {
      setSending(false);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch { /* ignore */ }
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <Loader2 className="mx-auto animate-spin text-lime-300" size={32} />
      </main>
    );
  }

  if (!meme) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl">🕳️</p>
        <h1 className="font-display mt-3 text-2xl font-bold">Meme fell into the void</h1>
        <Link href="/" className="mt-4 inline-block rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-black">
          Back to feed
        </Link>
      </main>
    );
  }

  const tags = meme.tags ? meme.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-white">
        <ArrowLeft size={15} /> Back to feed
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#101019]">
            <div className="flex items-center gap-3 p-5 pb-0">
              <Link href={`/u/${meme.handle}`} className="flex items-center gap-2.5">
                <span className="grid h-11 w-11 place-items-center rounded-full text-xl" style={{ background: meme.avatarColor }}>
                  {meme.avatarEmoji}
                </span>
                <span>
                  <span className="flex items-center gap-1 font-bold">
                    {meme.displayName}
                    {meme.verified && <BadgeCheck size={15} className="text-sky-400" />}
                  </span>
                  <span className="text-xs text-zinc-500">
                    @{meme.handle} · Lv {meme.level ?? 1} · {timeAgo(meme.createdAt)}
                  </span>
                </span>
              </Link>
              <button
                onClick={share}
                className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[13px] font-bold text-zinc-300 hover:border-lime-300/40 hover:text-lime-300"
              >
                <Share2 size={14} /> {shared ? "Copied!" : "Share"}
              </button>
            </div>
            <h1 className="font-display px-5 pb-3 pt-3 text-2xl font-bold leading-tight">{meme.title}</h1>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                {tags.map((t) => (
                  <span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-zinc-400">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <div className="px-5">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <MemeImage imageUrl={meme.imageUrl} topText={meme.topText} bottomText={meme.bottomText} title={meme.title} aspect="aspect-[16/10]" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 p-5">
              <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-black/40">
                <button
                  onClick={() => doVote(1)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold transition ${vote === 1 ? "bg-lime-300 text-black" : "text-zinc-400 hover:text-lime-300"}`}
                >
                  <ArrowBigUp size={20} /> Upvote
                </button>
                <span className={`min-w-12 text-center text-base font-black tabular-nums ${score > 0 ? "text-lime-300" : score < 0 ? "text-red-400" : "text-zinc-400"}`}>
                  {formatNumber(score)}
                </span>
                <button
                  onClick={() => doVote(-1)}
                  className={`px-4 py-2.5 transition ${vote === -1 ? "bg-red-400 text-black" : "text-zinc-400 hover:text-red-400"}`}
                  aria-label="Downvote"
                >
                  <ArrowBigDown size={20} />
                </button>
              </div>
              <span className="flex items-center gap-1.5 text-sm font-bold text-zinc-500">
                <Eye size={16} /> {formatNumber(meme.views)} views
              </span>
            </div>
          </article>

          {/* comments */}
          <section className="mt-5 rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
            <h2 className="font-display text-lg font-bold">Comments ({comments.length})</h2>
            <div className="mt-3 flex gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg" style={{ background: user?.avatarColor ?? "#27272a" }}>
                {user?.avatarEmoji ?? "🙂"}
              </span>
              <div className="flex flex-1 gap-2">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={user ? `Reply as @${user.handle}... (+10 XP)` : "Pick a persona to comment..."}
                  className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                />
                <button
                  onClick={send}
                  disabled={sending || !body.trim() || !user}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime-300 text-black disabled:opacity-40"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5 rounded-2xl border border-white/5 bg-black/30 p-3.5">
                  <Link href={`/u/${c.handle}`}>
                    <span className="grid h-8 w-8 place-items-center rounded-full text-base" style={{ background: c.avatarColor }}>
                      {c.avatarEmoji}
                    </span>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[13px]">
                      <Link href={`/u/${c.handle}`} className="font-bold hover:underline">
                        {c.displayName}
                      </Link>
                      {c.verified && <BadgeCheck size={12} className="text-sky-400" />}
                      <span className="text-zinc-600">@{c.handle} · {timeAgo(c.createdAt)}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">{c.body}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">
                  No comments yet. Say something unhinged (respectfully).
                </p>
              )}
            </div>
          </section>
        </div>

        {/* side */}
        <aside className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">About the memer</p>
            <Link href={`/u/${meme.handle}`} className="mt-2.5 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full text-2xl" style={{ background: meme.avatarColor }}>
                {meme.avatarEmoji}
              </span>
              <span>
                <span className="flex items-center gap-1 font-bold">
                  {meme.displayName}
                  {meme.verified && <BadgeCheck size={14} className="text-sky-400" />}
                </span>
                <span className="text-xs text-zinc-500">@{meme.handle}</span>
              </span>
            </Link>
            {meme.bio && <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-400">{meme.bio}</p>}
            <Link
              href={`/u/${meme.handle}`}
              className="mt-3 block rounded-full bg-white/10 py-2 text-center text-[13px] font-bold transition hover:bg-white/15"
            >
              View profile
            </Link>
          </div>

          <div>
            <p className="flex items-center gap-1.5 px-1 pb-3 text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              <Flame size={14} className="text-lime-300" /> More heat
            </p>
            <div className="space-y-4">
              {more.map((m) => (
                <MemeCard key={m.id} meme={m} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
