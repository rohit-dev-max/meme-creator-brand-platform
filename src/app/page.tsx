"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Clock,
  Trophy,
  Search,
  Zap,
  Swords,
  Briefcase,
  TrendingUp,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import MemeCard, { MemeWithUser } from "@/components/MemeCard";
import { useCurrentUser, formatNumber, timeAgo } from "@/lib/user-context";

type Sort = "hot" | "new" | "top";

export default function HomePage() {
  const { user } = useCurrentUser();
  const [sort, setSort] = useState<Sort>("hot");
  const [memes, setMemes] = useState<MemeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [challenges, setChallenges] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const load = async (s: Sort, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: s, limit: "30" });
      if (user) params.set("viewerId", user.id);
      if (q) params.set("q", q);
      const res = await fetch(`/api/memes?${params}`);
      const data = await res.json();
      let list = data.memes ?? [];
      // auto-seed if empty
      if (list.length === 0 && !seeding) {
        setSeeding(true);
        try {
          await fetch("/api/seed", { method: "POST" });
          const r2 = await fetch(`/api/memes?${params}`);
          const d2 = await r2.json();
          list = d2.memes ?? [];
          window.location.reload();
          return;
        } catch { /* ignore */ }
        setSeeding(false);
      }
      setMemes(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadSide = async () => {
    try {
      const [c, b, l] = await Promise.all([
        fetch("/api/challenges").then((r) => r.json()),
        fetch("/api/campaigns").then((r) => r.json()),
        fetch("/api/leaderboard").then((r) => r.json()),
      ]);
      setChallenges((c.challenges ?? []).filter((x: any) => x.status === "live").slice(0, 3));
      setCampaigns((b.campaigns ?? []).slice(0, 3));
      setLeaders((l.topMemers ?? []).slice(0, 5));
      setStats(l.stats ?? null);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load(sort, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, user?.id, query]);

  useEffect(() => {
    loadSide();
  }, []);

  return (
    <main className="relative min-h-screen">
      {/* hero bg */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-lime-400/20 blur-[120px]" />
        <div className="absolute -top-20 right-1/4 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-[120px]" />
      </div>

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-3.5 py-1.5 text-xs font-bold text-lime-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-300" />
              </span>
              {stats ? `${formatNumber(Number(stats.memes) || 0)} memes posted` : "Season 7 live"} · $8,250 in prizes this week
            </div>
            <h1 className="font-display mt-4 text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">
              CREATE.
              <br />
              POST. <span className="text-lime-300">COMPETE.</span>
              <br />
              <span className="text-stroke">GET PAID.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
              MemeArena is the home for memers — a meme studio with viral templates,
              a feed that actually rewards bangers, cash-prize battles, and a brand
              marketplace where companies pay you to be funny. Plus a built-in{" "}
              <Link href="/memes" className="font-bold text-fuchsia-300 hover:underline">AI meme maker</Link>,{" "}
              <Link href="/translate" className="font-bold text-sky-300 hover:underline">translator in 30 languages</Link>, and{" "}
              <Link href="/help" className="font-bold text-emerald-300 hover:underline">24/7 help center</Link>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="glow-lime flex items-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-extrabold text-black transition hover:bg-lime-200"
              >
                <Zap size={17} strokeWidth={2.75} /> Start creating
              </Link>
              <Link
                href="/battles"
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold transition hover:border-fuchsia-400/50 hover:text-fuchsia-200"
              >
                <Swords size={16} /> Join a battle
              </Link>
              <Link
                href="/brands"
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold transition hover:border-amber-300/50 hover:text-amber-200"
              >
                <Briefcase size={16} /> Get brand deals
              </Link>
            </div>
            {/* how it works */}
            <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: "🤖", t: "AI Memes", d: "Captions in 1 click", href: "/memes" },
                { icon: "🌍", t: "Translate", d: "30 languages", href: "/translate" },
                { icon: "⚔️", t: "Battles", d: "Win cash prizes", href: "/battles" },
                { icon: "💰", t: "Brands", d: "Paid meme gigs", href: "/brands" },
              ].map((s) => (
                <Link key={s.t} href={s.href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-lime-300/40">
                  <span className="text-xl">{s.icon}</span>
                  <p className="mt-1 text-[13px] font-extrabold">{s.t}</p>
                  <p className="text-[11px] text-zinc-500">{s.d}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* hero side: trending strip */}
          <div className="relative hidden lg:block">
            <div className="animate-float rounded-3xl border border-white/10 bg-[#0e0e16]/90 p-4 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between px-1 pb-3">
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                  <TrendingUp size={14} className="text-lime-300" /> Trending now
                </p>
                <Link href="/leaderboard" className="text-xs font-bold text-lime-300 hover:underline">
                  Rankings →
                </Link>
              </div>
              <div className="space-y-2">
                {memes.slice(0, 3).map((m, i) => (
                  <Link
                    key={m.id}
                    href={`/meme/${m.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-2.5 transition hover:border-lime-300/30"
                  >
                    <span className="font-display w-6 text-center text-xl font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{m.title}</span>
                      <span className="text-[11px] text-zinc-500">
                        @{m.handle} · ▲ {formatNumber(m.score)}
                      </span>
                    </span>
                  </Link>
                ))}
                {memes.length === 0 && (
                  <div className="rounded-2xl bg-black/40 p-6 text-center text-sm text-zinc-500">
                    Loading heat...
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-lime-300/10 p-2.5">
                  <p className="font-display text-lg font-bold text-lime-300">$8.2k</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">prizes live</p>
                </div>
                <div className="rounded-xl bg-fuchsia-400/10 p-2.5">
                  <p className="font-display text-lg font-bold text-fuchsia-300">128k</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">memers</p>
                </div>
                <div className="rounded-xl bg-sky-400/10 p-2.5">
                  <p className="font-display text-lg font-bold text-sky-300">340+</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">brands</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEED */}
      <section className="relative mx-auto max-w-7xl gap-6 px-4 pb-16 lg:grid lg:grid-cols-[1fr_340px]">
        <div>
          {/* controls */}
          <div className="sticky top-[104px] z-30 -mx-4 mb-5 border-y border-white/10 bg-[#07070c]/90 px-4 py-3 backdrop-blur-xl sm:top-[97px] lg:top-[105px]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 p-1">
                {(
                  [
                    { id: "hot", label: "Hot", icon: Flame },
                    { id: "new", label: "New", icon: Clock },
                    { id: "top", label: "Top", icon: Trophy },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSort(t.id)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-bold transition ${
                      sort === t.id ? "bg-lime-300 text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery(search);
                }}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2"
              >
                <Search size={15} className="shrink-0 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search memes, tags, vibes..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setQuery("");
                    }}
                    className="text-xs font-bold text-zinc-500 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>
          </div>

          {query && (
            <p className="mb-4 text-sm text-zinc-400">
              Results for <span className="font-bold text-white">“{query}”</span> — {memes.length} bangers
            </p>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-[#101019] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-white/10" />
                    <div className="h-4 w-40 rounded bg-white/10" />
                  </div>
                  <div className="mt-4 aspect-[4/3] rounded-xl bg-white/5" />
                </div>
              ))}
            </div>
          ) : memes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <p className="text-4xl">🏜️</p>
              <p className="font-display mt-3 text-xl font-bold">No memes here yet</p>
              <p className="mt-1 text-sm text-zinc-500">Be the first to post a banger.</p>
              <Link
                href="/create"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-black"
              >
                <Sparkles size={15} /> Create a meme
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {memes.map((m) => (
                <MemeCard key={m.id} meme={m} />
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="mt-8 space-y-5 lg:mt-0">
          {/* battles */}
          <div className="overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-b from-fuchsia-500/10 to-transparent">
            <div className="flex items-center justify-between p-4 pb-2">
              <p className="flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-widest">
                <Swords size={14} className="text-fuchsia-300" /> Live battles
              </p>
              <Link href="/battles" className="flex items-center gap-0.5 text-xs font-bold text-fuchsia-300">
                All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2 p-4 pt-2">
              {challenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/battles/${c.id}`}
                  className="block rounded-2xl border border-white/10 bg-black/40 p-3 transition hover:border-fuchsia-400/40"
                >
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <span>{c.sponsorEmoji}</span> {c.title}
                  </p>
                  <p className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-bold text-fuchsia-300">{c.prize}</span>
                    <span>{c.entryCount} entries · ends {timeAgo(c.endsAt)}</span>
                  </p>
                </Link>
              ))}
              {challenges.length === 0 && (
                <p className="p-3 text-center text-xs text-zinc-500">
                  {seeding ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Loading battles..."}
                </p>
              )}
            </div>
          </div>

          {/* brands */}
          <div className="overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-b from-amber-400/10 to-transparent">
            <div className="flex items-center justify-between p-4 pb-2">
              <p className="flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-widest">
                <Briefcase size={14} className="text-amber-300" /> Brand gigs
              </p>
              <Link href="/brands" className="flex items-center gap-0.5 text-xs font-bold text-amber-300">
                All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2 p-4 pt-2">
              {campaigns.map((c) => (
                <Link
                  key={c.id}
                  href="/brands"
                  className="block rounded-2xl border border-white/10 bg-black/40 p-3 transition hover:border-amber-300/40"
                >
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    <span>{c.brandLogoEmoji}</span> {c.title}
                  </p>
                  <p className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                    <span>{c.brandName}</span>
                    <span className="font-bold text-amber-300">
                      ${formatNumber(c.budgetMin)}–${formatNumber(c.budgetMax)}
                    </span>
                  </p>
                </Link>
              ))}
              {campaigns.length === 0 && (
                <p className="p-3 text-center text-xs text-zinc-500">Loading gigs...</p>
              )}
            </div>
          </div>

          {/* leaderboard */}
          <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-4">
            <div className="flex items-center justify-between pb-3">
              <p className="flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-widest text-zinc-300">
                <Trophy size={14} className="text-lime-300" /> Top memers
              </p>
              <Link href="/leaderboard" className="flex items-center gap-0.5 text-xs font-bold text-lime-300">
                All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1.5">
              {leaders.map((l, i) => (
                <Link
                  key={l.id}
                  href={`/u/${l.handle}`}
                  className="flex items-center gap-2.5 rounded-xl p-2 transition hover:bg-white/5"
                >
                  <span
                    className={`font-display w-6 text-center text-sm font-bold ${
                      i === 0 ? "text-amber-300" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-zinc-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-base"
                    style={{ background: l.avatarColor }}
                  >
                    {l.avatarEmoji}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="flex items-center gap-1 truncate text-[13px] font-bold">
                      {l.displayName}
                      {l.verified && <BadgeCheck size={12} className="text-sky-400" />}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Lv {l.level} · {formatNumber(Number(l.totalScore) || 0)} pts
                    </span>
                  </span>
                  <span className="text-[11px] font-extrabold text-lime-300">
                    {formatNumber(l.xp)} XP
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="glow-lime rounded-3xl bg-lime-300 p-5 text-black">
            <p className="font-display text-xl font-bold leading-tight">
              Your memes could pay your rent.
            </p>
            <p className="mt-1 text-[13px] font-medium text-black/70">
              Top memers earned $1,200+ last month from battles + brand deals.
            </p>
            <Link
              href="/create"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] font-bold text-lime-300"
            >
              Post your first meme <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
