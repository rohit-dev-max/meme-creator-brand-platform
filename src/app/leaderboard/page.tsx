"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, BadgeCheck, Flame, Medal, Crown } from "lucide-react";
import { formatNumber } from "@/lib/user-context";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [topMemes, setTopMemes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        setLeaders(d.topMemers ?? []);
        setTopMemes(d.topMemes ?? []);
        setStats(d.stats ?? null);
        setLoading(false);
      });
  }, []);

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-80 w-80 rounded-full bg-amber-400/15 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3.5 py-1.5 text-xs font-bold text-amber-200">
          <Trophy size={13} /> Season 7 · resets in 12 days
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          HALL OF <span className="text-amber-300">FAME</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          The memers with the most XP, the hardest-hitting bangers, and the fattest bags.
          Top 3 at season end split a $5,000 bonus.
        </p>

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { v: formatNumber(Number(stats.memes) || 0), l: "memes posted" },
              { v: formatNumber(Number(stats.memers) || 0), l: "memers" },
              { v: formatNumber(Number(stats.votes) || 0), l: "upvotes cast" },
              { v: `${stats.live_battles ?? 0}`, l: "live battles" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="font-display text-2xl font-bold">{s.v}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        {/* podium */}
        {!loading && leaders.length >= 3 && (
          <div className="mt-8 grid items-end gap-3 sm:grid-cols-3">
            {[
              { u: leaders[1], place: 2, h: "pt-8", medal: "🥈" },
              { u: leaders[0], place: 1, h: "pt-10", medal: "🥇", crown: true },
              { u: leaders[2], place: 3, h: "pt-6", medal: "🥉" },
            ].map(({ u, place, h, medal, crown }) => (
              <Link
                key={u.id}
                href={`/u/${u.handle}`}
                className={`relative overflow-hidden rounded-3xl border text-center transition hover:-translate-y-1 ${
                  place === 1 ? "border-amber-300/50 bg-gradient-to-b from-amber-300/15 to-transparent" : "border-white/10 bg-white/[0.02]"
                } ${h} px-4 pb-6`}
              >
                {crown && <Crown size={24} className="absolute left-1/2 top-3 -translate-x-1/2 text-amber-300" />}
                <span className="grid h-16 w-16 mx-auto place-items-center rounded-full text-3xl" style={{ background: u.avatarColor }}>
                  {u.avatarEmoji}
                </span>
                <p className="mt-2 text-2xl">{medal}</p>
                <p className="mt-1 flex items-center justify-center gap-1 font-bold">
                  {u.displayName}
                  {u.verified && <BadgeCheck size={14} className="text-sky-400" />}
                </p>
                <p className="text-xs text-zinc-500">@{u.handle} · Lv {u.level}</p>
                <p className="font-display mt-2 text-xl font-bold text-amber-300">{formatNumber(u.xp)} XP</p>
                <p className="text-[11px] text-zinc-500">{u.memeCount} memes · {formatNumber(Number(u.totalScore) || 0)} pts</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* full ranking */}
          <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-4">
            <p className="flex items-center gap-1.5 px-2 pb-3 text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              <Medal size={14} className="text-amber-300" /> Full rankings
            </p>
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {leaders.map((l, i) => (
                  <Link
                    key={l.id}
                    href={`/u/${l.handle}`}
                    className={`flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-white/5 ${i < 3 ? "bg-white/[0.03] ring-1 ring-white/5" : ""}`}
                  >
                    <span className={`font-display w-8 text-center text-lg font-bold ${i === 0 ? "text-amber-300" : i === 1 ? "text-zinc-200" : i === 2 ? "text-orange-400" : "text-zinc-600"}`}>
                      {i + 1}
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-full text-xl" style={{ background: l.avatarColor }}>
                      {l.avatarEmoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-sm font-bold">
                        {l.displayName}
                        {l.verified && <BadgeCheck size={13} className="text-sky-400" />}
                      </span>
                      <span className="text-xs text-zinc-500">
                        @{l.handle} · Lv {l.level} · {l.memeCount} memes · {formatNumber(Number(l.totalScore) || 0)} pts
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="font-display block text-base font-bold text-lime-300">{formatNumber(l.xp)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">xp</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-[13px] leading-relaxed text-zinc-400">
              <p className="font-bold text-white">How XP works</p>
              <p className="mt-1">+50 per meme · +75 per battle entry · +5 per upvote received · +10 per comment · +20 per brand pitch · +300 per deal won</p>
            </div>
          </div>

          {/* top memes */}
          <div>
            <p className="flex items-center gap-1.5 px-1 pb-3 text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              <Flame size={14} className="text-lime-300" /> Greatest bangers
            </p>
            <div className="space-y-3">
              {topMemes.map((m, i) => (
                <Link
                  key={m.id}
                  href={`/meme/${m.id}`}
                  className="card-hover block overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e16]"
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.imageUrl} alt={m.title} className="aspect-[16/8] w-full object-cover" loading="lazy" />
                    <span className="font-display absolute left-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold backdrop-blur">
                      #{i + 1} · ▲ {formatNumber(m.score)}
                    </span>
                    {m.topText && (
                      <p className="meme-text absolute inset-x-0 top-9 px-3 text-center text-base text-white">{m.topText}</p>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold">{m.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">by @{m.handle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
