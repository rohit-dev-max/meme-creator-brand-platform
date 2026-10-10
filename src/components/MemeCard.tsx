"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowBigUp, ArrowBigDown, MessageCircle, Eye, BadgeCheck, Share2, Swords } from "lucide-react";
import MemeImage from "./MemeImage";
import { useCurrentUser, timeAgo, formatNumber } from "@/lib/user-context";

export interface MemeWithUser {
  id: string;
  title: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  tags: string;
  upvotes: number;
  downvotes: number;
  score: number;
  views: number;
  commentsCount: number;
  createdAt: string;
  userId: string;
  handle: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  verified: boolean;
  userVote?: number;
  challengeId?: string | null;
  challengeTitle?: string | null;
}

export default function MemeCard({ meme, onVote }: { meme: MemeWithUser; onVote?: () => void }) {
  const { user } = useCurrentUser();
  const [voting, setVoting] = useState(false);
  const [localVote, setLocalVote] = useState<number>(meme.userVote ?? 0);
  const [localScore, setLocalScore] = useState(meme.score);
  const [shared, setShared] = useState(false);

  const tags = meme.tags ? meme.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const vote = async (value: number) => {
    if (!user || voting) return;
    setVoting(true);
    const prevVote = localVote;
    const prevScore = localScore;
    // optimistic
    let nextVote = value;
    let delta = value;
    if (prevVote === value) {
      nextVote = 0;
      delta = -value;
    } else if (prevVote !== 0) {
      delta = value * 2;
    }
    setLocalVote(nextVote);
    setLocalScore(prevScore + delta);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memeId: meme.id, userId: user.id, value: nextVote }),
      });
      if (!res.ok) throw new Error("vote failed");
      const data = await res.json();
      setLocalScore(data.score);
      setLocalVote(data.userVote ?? nextVote);
      onVote?.();
    } catch {
      setLocalVote(prevVote);
      setLocalScore(prevScore);
    } finally {
      setVoting(false);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/meme/${meme.id}`);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    }
  };

  return (
    <article className="card-hover overflow-hidden rounded-2xl border border-white/10 bg-[#101019]">
      {/* header */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href={`/u/${meme.handle}`} className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-full text-lg"
            style={{ background: meme.avatarColor }}
          >
            {meme.avatarEmoji}
          </span>
          <span className="leading-tight">
            <span className="flex items-center gap-1 text-sm font-bold">
              {meme.displayName}
              {meme.verified && <BadgeCheck size={14} className="text-sky-400" />}
            </span>
            <span className="text-xs text-zinc-500">
              @{meme.handle} · {timeAgo(meme.createdAt)}
            </span>
          </span>
        </Link>
        {meme.challengeTitle && (
          <Link
            href={`/battles`}
            className="ml-auto flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-bold text-fuchsia-300"
          >
            <Swords size={11} /> {meme.challengeTitle}
          </Link>
        )}
      </div>

      <Link href={`/meme/${meme.id}`} className="block px-4 pb-2 pt-2.5">
        <h3 className="font-display text-[17px] font-bold leading-snug hover:text-lime-200">
          {meme.title}
        </h3>
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((t) => (
              <span key={t} className="text-xs font-semibold text-zinc-500">
                #{t}
              </span>
            ))}
          </div>
        )}
      </Link>

      <Link href={`/meme/${meme.id}`} className="block px-4">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <MemeImage
            imageUrl={meme.imageUrl}
            topText={meme.topText}
            bottomText={meme.bottomText}
            title={meme.title}
          />
        </div>
      </Link>

      {/* actions */}
      <div className="flex items-center gap-2 px-4 py-3.5">
        <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-black/40">
          <button
            onClick={() => vote(1)}
            disabled={voting}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-bold transition ${
              localVote === 1 ? "bg-lime-300 text-black" : "text-zinc-400 hover:text-lime-300"
            }`}
            aria-label="Upvote"
          >
            <ArrowBigUp size={18} />
          </button>
          <span
            className={`min-w-10 text-center text-sm font-extrabold tabular-nums ${
              localScore > 0 ? "text-lime-300" : localScore < 0 ? "text-red-400" : "text-zinc-400"
            }`}
          >
            {formatNumber(localScore)}
          </span>
          <button
            onClick={() => vote(-1)}
            disabled={voting}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-bold transition ${
              localVote === -1 ? "bg-red-400 text-black" : "text-zinc-400 hover:text-red-400"
            }`}
            aria-label="Downvote"
          >
            <ArrowBigDown size={18} />
          </button>
        </div>

        <Link
          href={`/meme/${meme.id}`}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-2 text-[13px] font-bold text-zinc-300 transition hover:border-white/25 hover:text-white"
        >
          <MessageCircle size={15} /> {formatNumber(meme.commentsCount)}
        </Link>
        <span className="flex items-center gap-1.5 px-2 text-[13px] font-semibold text-zinc-500">
          <Eye size={15} /> {formatNumber(meme.views)}
        </span>
        <button
          onClick={share}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3.5 py-2 text-[13px] font-bold text-zinc-300 transition hover:border-lime-300/40 hover:text-lime-300"
        >
          <Share2 size={14} /> {shared ? "Copied!" : "Share"}
        </button>
      </div>
    </article>
  );
}
