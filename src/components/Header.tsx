"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Zap,
  Flame,
  Hammer,
  Swords,
  Briefcase,
  Trophy,
  Plus,
  ChevronDown,
  BadgeCheck,
  Sparkles,
  Languages,
  Bot,
  LifeBuoy,
} from "lucide-react";
import { useCurrentUser } from "@/lib/user-context";

const NAV = [
  { href: "/", label: "Feed", icon: Flame },
  { href: "/create", label: "Studio", icon: Hammer },
  { href: "/memes", label: "AI Memes", icon: Bot },
  { href: "/battles", label: "Battles", icon: Swords },
  { href: "/brands", label: "Brands", icon: Briefcase },
  { href: "/translate", label: "Translate", icon: Languages },
  { href: "/leaderboard", label: "Rankings", icon: Trophy },
  { href: "/help", label: "Help", icon: LifeBuoy },
];

export default function Header() {
  const pathname = usePathname();
  const { user, users, switchUser, createUser } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!handle.trim() || !displayName.trim()) return;
    setCreating(true);
    const clean = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    await createUser(clean, displayName.trim());
    setCreating(false);
    setShowCreate(false);
    setHandle("");
    setDisplayName("");
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07070c]/85 backdrop-blur-xl">
      {/* ticker */}
      <div className="overflow-hidden border-b border-white/5 bg-gradient-to-r from-lime-400 via-emerald-300 to-fuchsia-400 py-1">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap pr-8 text-[11px] font-bold uppercase tracking-widest text-black">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-8">
              <span>🔥 Weekly battle: $2,000 prize pool live now</span>
              <span>⚡ @danklord just won $500 from Duolingo brief</span>
              <span>🏆 12,408 memes posted today</span>
              <span>💰 Brands paid $48k to memers this week</span>
              <span>🚀 New template drop: Side Eye Cat</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-300 text-black shadow-[0_0_20px_rgba(163,230,53,0.5)]">
            <Zap size={20} strokeWidth={2.75} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            MEME<span className="text-lime-300">ARENA</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={15} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/create"
            className="hidden items-center gap-1.5 rounded-full bg-lime-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-lime-200 sm:flex"
          >
            <Plus size={16} strokeWidth={3} /> Post meme
          </Link>

          {/* user switcher */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-3 transition hover:border-lime-300/50"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-lg"
                style={{ background: user?.avatarColor ?? "#a3e635" }}
              >
                {user?.avatarEmoji ?? "🙂"}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="flex items-center gap-1 text-[13px] font-bold">
                  {user?.displayName ?? "Loading..."}
                  {user?.verified && <BadgeCheck size={13} className="text-sky-400" />}
                </span>
                <span className="text-[11px] text-zinc-400">
                  @{user?.handle} · Lv {user?.level}
                </span>
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {open && (
              <div className="animate-pop absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#12121c] shadow-2xl">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400">
                    <Sparkles size={12} className="text-lime-300" /> Switch persona
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Demo mode — play as any memer or brand.
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/5 ${
                        u.id === user?.id ? "bg-lime-300/10 ring-1 ring-lime-300/40" : ""
                      }`}
                    >
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-base"
                        style={{ background: u.avatarColor }}
                      >
                        {u.avatarEmoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 truncate text-[13px] font-bold">
                          {u.displayName}
                          {u.verified && <BadgeCheck size={12} className="text-sky-400" />}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          @{u.handle} · {u.role} · Lv {u.level}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                {!showCreate ? (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-bold text-lime-300 hover:bg-white/10"
                  >
                    <Plus size={14} /> Create your memer
                  </button>
                ) : (
                  <div className="space-y-2 border-t border-white/10 p-3">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Display name (e.g. Meme Queen)"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                    />
                    <input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="handle (e.g. memequeen)"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-lime-300/60"
                    />
                    <button
                      onClick={handleCreate}
                      disabled={creating || !handle.trim() || !displayName.trim()}
                      className="w-full rounded-lg bg-lime-300 py-2 text-sm font-bold text-black disabled:opacity-40"
                    >
                      {creating ? "Creating..." : "Join the Arena"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                active ? "bg-white text-black" : "bg-white/5 text-zinc-400"
              }`}
            >
              <Icon size={14} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
