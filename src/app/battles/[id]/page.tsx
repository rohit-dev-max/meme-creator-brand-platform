"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Users, Clock, Swords, Rocket, Loader2, Crown } from "lucide-react";
import MemeCard, { MemeWithUser } from "@/components/MemeCard";
import MemeImage from "@/components/MemeImage";
import { MEME_TEMPLATES } from "@/lib/templates";
import { useCurrentUser, timeAgo, formatNumber } from "@/lib/user-context";

export default function BattleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [challenge, setChallenge] = useState<any>(null);
  const [entries, setEntries] = useState<MemeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnter, setShowEnter] = useState(false);
  const [myMemes, setMyMemes] = useState<MemeWithUser[]>([]);
  const [selectedMeme, setSelectedMeme] = useState("");
  const [entering, setEntering] = useState(false);
  // quick-create state
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [title, setTitle] = useState("");
  const [tplIdx, setTplIdx] = useState(0);
  const [topText, setTopText] = useState(MEME_TEMPLATES[0].defaultTop);
  const [bottomText, setBottomText] = useState(MEME_TEMPLATES[0].defaultBottom);

  const load = async () => {
    setLoading(true);
    try {
      const params = user ? `?viewerId=${user.id}` : "";
      const res = await fetch(`/api/challenges/${id}${params}`);
      const data = await res.json();
      setChallenge(data.challenge ?? null);
      setEntries(data.entries ?? []);
    } finally {
      setLoading(false);
    }
  };

  const loadMine = async () => {
    if (!user) return;
    const res = await fetch(`/api/memes?sort=new&limit=30&handle=${user.handle}${`&viewerId=${user.id}`}`);
    const data = await res.json();
    setMyMemes((data.memes ?? []).filter((m: MemeWithUser) => m.userId === user.id));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => {
    if (showEnter) loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEnter]);

  const enter = async () => {
    if (!user) return;
    setEntering(true);
    try {
      let body: Record<string, unknown> = { userId: user.id };
      if (mode === "existing") {
        if (!selectedMeme) {
          setEntering(false);
          return;
        }
        body.memeId = selectedMeme;
      } else {
        if (!title.trim()) {
          setEntering(false);
          return;
        }
        const tpl = MEME_TEMPLATES[tplIdx];
        body = { ...body, title: title.trim(), imageUrl: tpl.imageUrl, topText, bottomText, tags: "battle", template: tpl.id };
      }
      const res = await fetch(`/api/challenges/${id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowEnter(false);
        setSelectedMeme("");
        setTitle("");
        load();
      }
    } finally {
      setEntering(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Loader2 className="mx-auto animate-spin text-fuchsia-300" size={32} />
        <p className="mt-3 text-sm text-zinc-500">Loading battle...</p>
      </main>
    );
  }

  if (!challenge) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-4xl">🥲</p>
        <h1 className="font-display mt-3 text-2xl font-bold">Battle not found</h1>
        <Link href="/battles" className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">
          Back to battles
        </Link>
      </main>
    );
  }

  const leader = entries[0];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8">
      <Link href="/battles" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-white">
        <ArrowLeft size={15} /> All battles
      </Link>

      {/* header */}
      <div className={`mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r ${challenge.coverGradient}`}>
        <div className="bg-black/55 p-6 backdrop-blur-[2px] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest ${
                  challenge.status === "live" ? "bg-lime-300 text-black" : "bg-white/20 text-white"
                }`}
              >
                {challenge.status === "live" ? "● Live now" : challenge.status}
              </span>
              <h1 className="font-display mt-3 text-3xl font-bold leading-tight text-white drop-shadow sm:text-4xl">
                {challenge.sponsorEmoji} {challenge.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">{challenge.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-[13px] font-bold text-white">
                <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
                  <Trophy size={14} className="text-amber-300" /> {challenge.prize}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
                  <Users size={14} /> {entries.length} entries
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5">
                  <Clock size={14} /> Ends {new Date(challenge.endsAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {challenge.status === "live" && (
              <button
                onClick={() => setShowEnter(!showEnter)}
                className="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-black transition hover:bg-lime-200"
              >
                <Swords size={17} /> Enter battle
              </button>
            )}
          </div>
          {challenge.rules && (
            <div className="mt-4 rounded-2xl bg-black/50 p-4 text-[13px] leading-relaxed text-zinc-300">
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Rules</p>
              <p className="whitespace-pre-line">{challenge.rules}</p>
            </div>
          )}
        </div>
      </div>

      {/* enter panel */}
      {showEnter && (
        <div className="animate-pop mt-5 rounded-3xl border border-fuchsia-400/30 bg-[#12121c] p-5">
          <p className="font-display text-lg font-bold">Enter “{challenge.title}”</p>
          <div className="mt-3 flex gap-1.5">
            <button
              onClick={() => setMode("existing")}
              className={`rounded-full px-4 py-2 text-[13px] font-bold ${mode === "existing" ? "bg-white text-black" : "bg-white/5 text-zinc-400"}`}
            >
              Use my meme
            </button>
            <button
              onClick={() => setMode("new")}
              className={`rounded-full px-4 py-2 text-[13px] font-bold ${mode === "new" ? "bg-white text-black" : "bg-white/5 text-zinc-400"}`}
            >
              Quick-create new
            </button>
          </div>

          {mode === "existing" ? (
            <div className="mt-4">
              {myMemes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">
                  You haven't posted any memes yet. Switch to quick-create or{" "}
                  <Link href="/create" className="font-bold text-lime-300">open the Studio</Link>.
                </p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {myMemes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMeme(m.id)}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition ${
                        selectedMeme === m.id ? "border-fuchsia-400 bg-fuchsia-400/10" : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold">{m.title}</span>
                        <span className="text-[11px] text-zinc-500">▲ {formatNumber(m.score)} · {timeAgo(m.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Battle entry title..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={topText}
                    onChange={(e) => setTopText(e.target.value.toUpperCase())}
                    placeholder="TOP"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
                  />
                  <input
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value.toUpperCase())}
                    placeholder="BOTTOM"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {MEME_TEMPLATES.slice(0, 8).map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTplIdx(i);
                        setTopText(t.defaultTop);
                        setBottomText(t.defaultBottom);
                      }}
                      className={`overflow-hidden rounded-xl border-2 ${tplIdx === i ? "border-fuchsia-400" : "border-transparent"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.imageUrl} alt={t.name} className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <MemeImage imageUrl={MEME_TEMPLATES[tplIdx].imageUrl} topText={topText} bottomText={bottomText} title="preview" />
              </div>
            </div>
          )}

          <button
            onClick={enter}
            disabled={entering || !user || (mode === "existing" ? !selectedMeme : !title.trim())}
            className="mt-4 flex items-center gap-2 rounded-full bg-fuchsia-400 px-6 py-2.5 text-sm font-extrabold text-black disabled:opacity-40"
          >
            {entering ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
            {entering ? "Entering..." : "Submit entry (+75 XP)"}
          </button>
        </div>
      )}

      {/* leaderboard strip */}
      {entries.length > 0 && (
        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          {entries.slice(0, 3).map((e, i) => (
            <div
              key={e.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${
                i === 0 ? "border-amber-300/40 bg-amber-300/5" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <span className="font-display text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-lg"
                style={{ background: e.avatarColor }}
              >
                {e.avatarEmoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">@{e.handle}</span>
                <span className="text-[11px] text-zinc-500">▲ {formatNumber(e.score)} votes</span>
              </span>
              {i === 0 && <Crown size={16} className="text-amber-300" />}
            </div>
          ))}
        </div>
      )}

      {/* entries */}
      <h2 className="font-display mt-8 text-xl font-bold">
        Entries <span className="text-zinc-500">({entries.length}) — vote for the winner</span>
      </h2>
      {entries.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-white/15 p-12 text-center">
          <p className="text-4xl">⚔️</p>
          <p className="font-display mt-3 text-lg font-bold">No entries yet. First mover advantage.</p>
          <p className="text-sm text-zinc-500">Enter now and take the early lead.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {entries.map((e, i) => (
            <div key={e.id} className="relative">
              {i < 3 && (
                <span className="absolute -top-2.5 left-4 z-10 rounded-full bg-amber-300 px-2.5 py-0.5 text-[11px] font-black text-black">
                  #{i + 1} LEADING
                </span>
              )}
              <MemeCard meme={e} onVote={load} />
            </div>
          ))}
        </div>
      )}

      {leader && (
        <p className="mt-6 text-center text-xs text-zinc-600">
          Current leader: @{leader.handle} with {formatNumber(leader.score)} votes · Winner decided by community votes at deadline.
        </p>
      )}
    </main>
  );
}
