"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Zap, Flame, Eye, Loader2, Briefcase } from "lucide-react";
import MemeCard, { MemeWithUser } from "@/components/MemeCard";
import { useCurrentUser, formatNumber, levelProgress } from "@/lib/user-context";

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState<any>(null);
  const [memes, setMemes] = useState<MemeWithUser[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = user ? `?viewerId=${user.id}` : "";
        const res = await fetch(`/api/users/${handle}${params}`);
        const data = await res.json();
        setProfile(data.user ?? null);
        setMemes(data.memes ?? []);
        setTotals(data.totals ?? null);
        if (data.user) {
          const a = await fetch(`/api/applications?memerId=${data.user.id}`).then((r) => r.json());
          setApps(a.applications ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [handle, user?.id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <Loader2 className="mx-auto animate-spin text-lime-300" size={32} />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl">👻</p>
        <h1 className="font-display mt-3 text-2xl font-bold">@{handle} doesn't exist (yet)</h1>
        <Link href="/" className="mt-4 inline-block rounded-full bg-lime-300 px-5 py-2.5 text-sm font-bold text-black">
          Back to feed
        </Link>
      </main>
    );
  }

  const isBrand = profile.role === "brand";
  const hired = apps.filter((a) => a.status === "accepted").length;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-400 hover:text-white">
        <ArrowLeft size={15} /> Back to feed
      </Link>

      {/* header card */}
      <div className="relative mt-4 overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e16]">
        <div className="h-32 bg-gradient-to-r from-lime-400/40 via-fuchsia-500/30 to-sky-500/30" style={{ background: `linear-gradient(120deg, ${profile.avatarColor}55, transparent)` }} />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <span className="grid h-20 w-20 place-items-center rounded-3xl border-4 border-[#0e0e16] text-4xl" style={{ background: profile.avatarColor }}>
              {profile.avatarEmoji}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="font-display flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
                {profile.displayName}
                {profile.verified && <BadgeCheck size={22} className="text-sky-400" />}
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${isBrand ? "bg-amber-300 text-black" : "bg-lime-300/15 text-lime-300"}`}>
                  {profile.role}
                </span>
              </h1>
              <p className="text-sm text-zinc-500">@{profile.handle} · Level {profile.level} memer</p>
            </div>
            {user?.id === profile.id ? (
              <span className="rounded-full border border-lime-300/40 bg-lime-300/10 px-4 py-2 text-[13px] font-bold text-lime-300">
                This is you 👋
              </span>
            ) : (
              <Link href="/create" className="rounded-full bg-lime-300 px-5 py-2.5 text-sm font-extrabold text-black">
                Challenge them ⚔️
              </Link>
            )}
          </div>
          {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">{profile.bio}</p>}

          {/* xp bar */}
          <div className="mt-4 max-w-xl">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1 text-lime-300">
                <Zap size={12} /> {formatNumber(profile.xp)} XP
              </span>
              <span className="text-zinc-500">Level {profile.level} → {profile.level + 1}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-lime-300 to-emerald-400 transition-all" style={{ width: `${levelProgress(profile.xp)}%` }} />
            </div>
          </div>

          {/* stats */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {[
              { icon: "🖼️", v: formatNumber(Number(totals?.count) || 0), l: "memes" },
              { icon: "▲", v: formatNumber(Number(totals?.total_score) || 0), l: "total score" },
              { icon: "👁️", v: formatNumber(Number(totals?.total_views) || 0), l: "views" },
              { icon: "👥", v: formatNumber(profile.followers), l: "followers" },
              { icon: "💰", v: `${hired}`, l: "brand deals won" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
                <p className="font-display text-xl font-bold">{s.v}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold">
            <Flame size={18} className="text-lime-300" /> Top memes by @{profile.handle}
          </h2>
          {memes.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-white/15 p-10 text-center">
              <p className="text-3xl">🌱</p>
              <p className="mt-2 text-sm text-zinc-500">No memes yet. The grind starts now.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {memes.map((m) => (
                <MemeCard key={m.id} meme={m} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              <Briefcase size={13} className="text-amber-300" /> Brand track record
            </p>
            {apps.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-white/10 p-4 text-center text-[13px] text-zinc-500">
                No pitches yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {apps.slice(0, 5).map((a) => (
                  <div key={a.id} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                    <p className="truncate text-[13px] font-bold">
                      {a.brandLogoEmoji} {a.title}
                    </p>
                    <p className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">${formatNumber(a.budgetMin)}–${formatNumber(a.budgetMax)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${a.status === "accepted" ? "bg-lime-300 text-black" : a.status === "rejected" ? "bg-red-400/20 text-red-300" : "bg-white/10 text-zinc-300"}`}>
                        {a.status}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/brands" className="mt-3 block rounded-full bg-white/10 py-2 text-center text-[13px] font-bold hover:bg-white/15">
              Browse brand gigs
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
            <p className="text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">Achievements</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { e: "🔥", t: "Hot page", on: Number(totals?.total_score) > 100 },
                { e: "⚔️", t: "Battler", on: memes.length >= 3 },
                { e: "💰", t: "Paid", on: hired > 0 },
                { e: "👁️", t: "Viral", on: Number(totals?.total_views) > 10000 },
                { e: "⚡", t: "Grinder", on: profile.xp > 1000 },
                { e: "👑", t: "Legend", on: profile.level >= 5 },
              ].map((a) => (
                <div key={a.t} className={`rounded-2xl border p-2.5 ${a.on ? "border-lime-300/40 bg-lime-300/10" : "border-white/5 bg-black/30 opacity-40 grayscale"}`}>
                  <p className="text-xl">{a.e}</p>
                  <p className="mt-0.5 text-[10px] font-bold">{a.t}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
