"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  BadgeCheck,
  Clock,
  Users,
  Send,
  Check,
  X,
  Loader2,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { useCurrentUser, timeAgo, formatNumber } from "@/lib/user-context";

export default function BrandsPage() {
  const { user } = useCurrentUser();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [showPost, setShowPost] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [pitch, setPitch] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [sending, setSending] = useState(false);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [brandApps, setBrandApps] = useState<Record<string, any[]>>({});
  const [form, setForm] = useState({
    title: "",
    brief: "",
    category: "General",
    budgetMin: 200,
    budgetMax: 1500,
    requirements: "",
    brandName: "",
    brandLogoEmoji: "🏢",
  });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  };

  const loadMine = async () => {
    if (!user) return;
    const res = await fetch(`/api/applications?memerId=${user.id}`);
    const data = await res.json();
    setMyApps(data.applications ?? []);
  };

  const loadBrandApps = async (campaignId: string) => {
    const res = await fetch(`/api/applications?campaignId=${campaignId}`);
    const data = await res.json();
    setBrandApps((p) => ({ ...p, [campaignId]: data.applications ?? [] }));
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleExpand = (id: string, isOwner: boolean) => {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next && isOwner) loadBrandApps(id);
  };

  const apply = async (campaignId: string) => {
    if (!user || !pitch.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, memerId: user.id, pitch: pitch.trim(), portfolioUrl: portfolio || `https://memearena.gg/u/${user.handle}` }),
      });
      if (res.ok) {
        setApplying(null);
        setPitch("");
        setPortfolio("");
        loadMine();
        load();
      }
    } finally {
      setSending(false);
    }
  };

  const create = async () => {
    if (!user || !form.title.trim() || !form.brief.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandUserId: user.id,
          ...form,
          brandName: form.brandName || user.displayName,
        }),
      });
      if (res.ok) {
        setShowPost(false);
        setForm({ title: "", brief: "", category: "General", budgetMin: 200, budgetMax: 1500, requirements: "", brandName: "", brandLogoEmoji: "🏢" });
        load();
      }
    } finally {
      setCreating(false);
    }
  };

  const decide = async (appId: string, status: string, campaignId: string) => {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: appId, status }),
    });
    loadBrandApps(campaignId);
  };

  const categories = ["All", ...Array.from(new Set(campaigns.map((c) => c.category)))];
  const filtered = category === "All" ? campaigns : campaigns.filter((c) => c.category === category);
  const totalValue = campaigns.reduce((s, c) => s + (c.budgetMax || 0), 0);
  const appliedIds = new Set(myApps.map((a) => a.campaignId));

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-amber-400/15 blur-[120px]" />
        <div className="absolute right-1/4 top-10 h-80 w-80 rounded-full bg-orange-500/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3.5 py-1.5 text-xs font-bold text-amber-200">
              <Briefcase size={13} /> Brand marketplace · ${formatNumber(totalValue)} in open gigs
            </p>
            <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              MEMES THAT <span className="text-amber-300">PAY</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Brands post briefs with real budgets. Memers pitch, get hired, and get paid for
              being funny. No middlemen, no exposure-bucks — just deals.
            </p>
          </div>
          <button
            onClick={() => setShowPost(!showPost)}
            className="flex items-center gap-2 rounded-full bg-amber-300 px-5 py-2.5 text-sm font-extrabold text-black transition hover:bg-amber-200"
          >
            <Plus size={16} strokeWidth={3} /> Post a brief
          </button>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { t: `$${formatNumber(totalValue)}`, d: "Open budgets" },
            { t: `${campaigns.length}`, d: "Active briefs" },
            { t: "$48k", d: "Paid this week" },
            { t: "340+", d: "Brands hiring" },
          ].map((s) => (
            <div key={s.d} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="font-display text-2xl font-bold text-amber-300">{s.t}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{s.d}</p>
            </div>
          ))}
        </div>

        {showPost && (
          <div className="animate-pop mt-5 rounded-3xl border border-amber-300/30 bg-[#12121c] p-5">
            <p className="font-display text-lg font-bold">Post a brand brief</p>
            <p className="text-[13px] text-zinc-400">
              Posting as <span className="font-bold text-white">{user?.displayName ?? "…"}</span> — switch to a brand persona in the header for full effect.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief title (e.g. Unhinged Summer Meme Drop)"
                className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-amber-300/60 md:col-span-2"
              />
              <textarea
                value={form.brief}
                onChange={(e) => setForm({ ...form, brief: e.target.value })}
                placeholder="The brief: vibe, deliverables, timeline, what good looks like..."
                rows={4}
                className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-amber-300/60 md:col-span-2"
              />
              <input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="Brand name"
                className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-amber-300/60"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-amber-300/60"
              >
                {["General", "Tech", "Food", "Beverage", "Fashion", "Gaming", "Finance", "Entertainment"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-zinc-500">
                  MIN $
                  <input
                    type="number"
                    value={form.budgetMin}
                    onChange={(e) => setForm({ ...form, budgetMin: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </label>
                <label className="text-xs font-bold text-zinc-500">
                  MAX $
                  <input
                    type="number"
                    value={form.budgetMax}
                    onChange={(e) => setForm({ ...form, budgetMax: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </label>
              </div>
              <input
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                placeholder="Requirements (e.g. 10k+ followers, 4 memes...)"
                className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none focus:border-amber-300/60"
              />
            </div>
            <button
              onClick={create}
              disabled={creating || !form.title.trim() || !form.brief.trim() || !user}
              className="mt-3 rounded-full bg-amber-300 px-6 py-2.5 text-sm font-extrabold text-black disabled:opacity-40"
            >
              {creating ? "Posting..." : "Publish brief"}
            </button>
          </div>
        )}

        {/* my applications */}
        {myApps.length > 0 && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-[#0e0e16] p-5">
            <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-zinc-400">
              <Send size={13} className="text-lime-300" /> My pitches ({myApps.length})
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {myApps.map((a) => (
                <div key={a.id} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className="flex items-center gap-1.5 truncate text-[13px] font-bold">
                    {a.brandLogoEmoji} {a.title}
                  </p>
                  <p className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      ${formatNumber(a.budgetMin)}–${formatNumber(a.budgetMax)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                        a.status === "accepted"
                          ? "bg-lime-300 text-black"
                          : a.status === "rejected"
                            ? "bg-red-400/20 text-red-300"
                            : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {a.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* filters */}
        <div className="mt-6 flex items-center gap-1.5 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition ${
                category === c ? "bg-amber-300 text-black" : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((c) => {
              const isOwner = user?.id === c.brandUserId;
              const open = expanded === c.id;
              const applied = appliedIds.has(c.id);
              return (
                <div key={c.id} className="card-hover overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e16]">
                  <div className="flex flex-wrap items-start gap-4 p-5">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl">
                      {c.brandLogoEmoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-zinc-400">
                        {c.brandName}
                        {c.verified && <BadgeCheck size={13} className="text-sky-400" />}
                        <span className="text-zinc-600">·</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{c.category}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock size={11} /> due {timeAgo(c.deadline)}
                        </span>
                      </p>
                      <h3 className="font-display mt-1 text-xl font-bold leading-snug">{c.title}</h3>
                      <p className={`mt-1.5 text-sm leading-relaxed text-zinc-400 ${open ? "" : "line-clamp-2"}`}>
                        {c.brief}
                      </p>
                    </div>
                    <div className="w-full shrink-0 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 sm:w-52">
                      <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                        <Wallet size={11} /> Budget
                      </p>
                      <p className="font-display mt-0.5 text-xl font-bold text-amber-300">
                        ${formatNumber(c.budgetMin)}–${formatNumber(c.budgetMax)}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                        <Users size={12} /> {c.applicants} pitched
                      </p>
                      <button
                        onClick={() => toggleExpand(c.id, isOwner)}
                        className="mt-3 w-full rounded-full bg-white py-2 text-[13px] font-extrabold text-black transition hover:bg-amber-200"
                      >
                        {open ? "Hide details" : isOwner ? "Review pitches" : "View + pitch"}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="animate-pop border-t border-white/10 bg-black/30 p-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Full brief</p>
                          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{c.brief}</p>
                          {c.requirements && (
                            <>
                              <p className="mt-4 text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Requirements</p>
                              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{c.requirements}</p>
                            </>
                          )}
                          <p className="mt-3 text-xs text-zinc-500">
                            Posted by <Link href={`/u/${c.handle}`} className="font-bold text-white">@{c.handle}</Link> · {timeAgo(c.createdAt)}
                          </p>
                        </div>

                        {isOwner ? (
                          <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">
                              Pitches ({(brandApps[c.id] ?? []).length})
                            </p>
                            <div className="mt-2 space-y-2">
                              {(brandApps[c.id] ?? []).map((a) => (
                                <div key={a.id} className="rounded-2xl border border-white/10 bg-[#12121c] p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="grid h-8 w-8 place-items-center rounded-full text-base" style={{ background: a.avatarColor }}>
                                      {a.avatarEmoji}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="flex items-center gap-1 truncate text-[13px] font-bold">
                                        {a.displayName}
                                        {a.verified && <BadgeCheck size={12} className="text-sky-400" />}
                                      </p>
                                      <p className="text-[11px] text-zinc-500">@{a.handle} · Lv {a.level} · {formatNumber(a.xp)} XP</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${a.status === "accepted" ? "bg-lime-300 text-black" : a.status === "rejected" ? "bg-red-400/20 text-red-300" : "bg-white/10 text-zinc-300"}`}>
                                      {a.status}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">“{a.pitch}”</p>
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={() => decide(a.id, "accepted", c.id)}
                                      className="flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1 text-xs font-extrabold text-black"
                                    >
                                      <Check size={12} strokeWidth={3} /> Hire
                                    </button>
                                    <button
                                      onClick={() => decide(a.id, "rejected", c.id)}
                                      className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-zinc-300"
                                    >
                                      <X size={12} /> Pass
                                    </button>
                                    <Link href={`/u/${a.handle}`} className="ml-auto flex items-center gap-0.5 text-xs font-bold text-zinc-500 hover:text-white">
                                      Portfolio <ArrowUpRight size={12} />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                              {(brandApps[c.id] ?? []).length === 0 && (
                                <p className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-[13px] text-zinc-500">
                                  No pitches yet — share your brief in the feed.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            {applied ? (
                              <div className="rounded-2xl border border-lime-300/30 bg-lime-300/5 p-5 text-center">
                                <Check size={24} className="mx-auto text-lime-300" />
                                <p className="font-display mt-2 font-bold">Pitch sent!</p>
                                <p className="mt-1 text-[13px] text-zinc-400">
                                  The brand reviews pitches in the order received. Winners get +300 XP and a bag.
                                </p>
                              </div>
                            ) : applying === c.id ? (
                              <div className="rounded-2xl border border-white/10 bg-[#12121c] p-4">
                                <p className="text-[13px] font-bold">Pitching as @{user?.handle}</p>
                                <textarea
                                  value={pitch}
                                  onChange={(e) => setPitch(e.target.value)}
                                  rows={4}
                                  placeholder="Why you? Drop your angle, your stats, your best idea for this brief..."
                                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-amber-300/60"
                                />
                                <input
                                  value={portfolio}
                                  onChange={(e) => setPortfolio(e.target.value)}
                                  placeholder="Portfolio link (optional)"
                                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-amber-300/60"
                                />
                                <div className="mt-2.5 flex gap-2">
                                  <button
                                    onClick={() => apply(c.id)}
                                    disabled={sending || !pitch.trim() || !user}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-amber-300 py-2.5 text-sm font-extrabold text-black disabled:opacity-40"
                                  >
                                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Send pitch (+20 XP)
                                  </button>
                                  <button
                                    onClick={() => setApplying(null)}
                                    className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-zinc-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5">
                                <p className="font-display text-lg font-bold">Want this bag?</p>
                                <p className="mt-1 text-[13px] text-zinc-400">
                                  Pitch the brand with your angle. Best pitches get hired — average
                                  response time is under 48 hours.
                                </p>
                                <button
                                  onClick={() => setApplying(c.id)}
                                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-300 py-2.5 text-sm font-extrabold text-black"
                                >
                                  <Send size={14} /> Pitch this brief
                                </button>
                                {!user && <p className="mt-2 text-center text-xs text-zinc-500">Pick a persona to pitch.</p>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-12 text-center">
            <p className="text-4xl">💼</p>
            <p className="font-display mt-3 text-lg font-bold">No briefs in {category}</p>
            <p className="text-sm text-zinc-500">Try another category or post the first one.</p>
          </div>
        )}
      </div>
    </main>
  );
}
