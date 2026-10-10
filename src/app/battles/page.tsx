"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swords, Trophy, Clock, Plus, Users, Zap, BadgeDollarSign } from "lucide-react";
import { timeAgo } from "@/lib/user-context";

export default function BattlesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "ended">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", prize: "$500", prizePool: 500, sponsorName: "Community", sponsorEmoji: "🏆" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/challenges");
      const data = await res.json();
      setChallenges(data.challenges ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "live" }),
      });
      setShowCreate(false);
      setForm({ title: "", description: "", prize: "$500", prizePool: 500, sponsorName: "Community", sponsorEmoji: "🏆" });
      load();
    } finally {
      setCreating(false);
    }
  };

  const filtered = filter === "all" ? challenges : challenges.filter((c) => c.status === filter);
  const totalPool = challenges.filter((c) => c.status === "live").reduce((s, c) => s + (c.prizePool || 0), 0);

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute right-1/3 top-10 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3.5 py-1.5 text-xs font-bold text-fuchsia-200">
              <Swords size={13} /> Meme battles · winners paid weekly
            </p>
            <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              THE <span className="text-fuchsia-400">BATTLE</span> ARENA
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Enter themed meme competitions, get voted up by the community, and walk away
              with cash, contracts and clout.{" "}
              <span className="font-bold text-white">${totalPool.toLocaleString()} live right now.</span>
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="glow-fuchsia flex items-center gap-2 rounded-full bg-fuchsia-400 px-5 py-2.5 text-sm font-extrabold text-black transition hover:bg-fuchsia-300"
          >
            <Plus size={16} strokeWidth={3} /> Host a battle
          </button>
        </div>

        {showCreate && (
          <div className="animate-pop mt-5 rounded-3xl border border-fuchsia-400/30 bg-[#12121c] p-5">
            <p className="font-display text-lg font-bold">Host your own battle</p>
            <p className="text-[13px] text-zinc-400">Brands and legends can sponsor battles. Entries flow in automatically.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Battle title (e.g. WFH Fails Championship)"
                className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.prize}
                  onChange={(e) => setForm({ ...form, prize: e.target.value })}
                  placeholder="$500"
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
                />
                <input
                  value={form.sponsorName}
                  onChange={(e) => setForm({ ...form, sponsorName: e.target.value })}
                  placeholder="Sponsor name"
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-fuchsia-400/60"
                />
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the theme, vibe and what wins..."
                rows={3}
                className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-fuchsia-400/60 md:col-span-2"
              />
            </div>
            <button
              onClick={create}
              disabled={creating || !form.title.trim() || !form.description.trim()}
              className="mt-3 rounded-full bg-fuchsia-400 px-6 py-2.5 text-sm font-extrabold text-black disabled:opacity-40"
            >
              {creating ? "Launching..." : "Launch battle"}
            </button>
          </div>
        )}

        {/* filters */}
        <div className="mt-6 flex items-center gap-1.5 overflow-x-auto">
          {(["all", "live", "upcoming", "ended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold capitalize transition ${
                filter === f ? "bg-fuchsia-400 text-black" : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All battles" : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/battles/${c.id}`}
                className="card-hover group overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e16]"
              >
                <div className={`relative bg-gradient-to-r p-5 ${c.coverGradient}`}>
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                          c.status === "live"
                            ? "bg-lime-300 text-black"
                            : c.status === "upcoming"
                              ? "bg-white/20 text-white backdrop-blur"
                              : "bg-black/50 text-zinc-300"
                        }`}
                      >
                        {c.status === "live" ? "● Live" : c.status}
                      </span>
                      <h3 className="font-display mt-2 text-2xl font-bold leading-tight text-white drop-shadow-lg">
                        {c.sponsorEmoji} {c.title}
                      </h3>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-black/60 px-3.5 py-2 text-center backdrop-blur">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <BadgeDollarSign size={11} /> Prize
                      </p>
                      <p className="font-display text-base font-bold text-amber-300">{c.prize}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="line-clamp-2 text-sm text-zinc-400">{c.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-fuchsia-300" /> {c.entryCount} entries
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-300" /> {Number(c.votesCount || 0).toLocaleString()} votes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> {c.status === "ended" ? `ended ${timeAgo(c.endsAt)}` : `ends ${timeAgo(c.endsAt)}`}
                    </span>
                    <span className="ml-auto font-bold text-white transition group-hover:translate-x-1">
                      Enter →{" "}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-12 text-center">
            <Trophy size={32} className="mx-auto text-zinc-600" />
            <p className="font-display mt-3 text-lg font-bold">No battles in this lane</p>
            <p className="text-sm text-zinc-500">Try another filter or host your own.</p>
          </div>
        )}
      </div>
    </main>
  );
}
