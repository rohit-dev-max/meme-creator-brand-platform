import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { votes, memes, users, notifications } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) return NextResponse.json({ error: "Log in to vote." }, { status: 401 });

    const { memeId, value } = await req.json();
    if (!memeId) return NextResponse.json({ error: "missing ids" }, { status: 400 });
    const v = value === 1 ? 1 : value === -1 ? -1 : 0;

    if (v === 0) {
      await db.delete(votes).where(and(eq(votes.memeId, memeId), eq(votes.userId, me.id)));
    } else {
      await db
        .insert(votes)
        .values({ memeId, userId: me.id, value: v })
        .onConflictDoUpdate({
          target: [votes.memeId, votes.userId],
          set: { value: v },
        });
    }

    const rows = await db.execute(sql`
      UPDATE memes SET
        upvotes = (SELECT COUNT(*) FROM votes WHERE meme_id = ${memeId} AND value = 1),
        downvotes = (SELECT COUNT(*) FROM votes WHERE meme_id = ${memeId} AND value = -1),
        score = (SELECT COALESCE(SUM(value),0) FROM votes WHERE meme_id = ${memeId})
      WHERE id = ${memeId}
      RETURNING upvotes, downvotes, score, user_id
    `);
    const updated = (rows.rows[0] as { upvotes: number; downvotes: number; score: number; user_id: string }) ?? null;

    if (updated && v !== 0) {
      const delta = v === 1 ? 5 : -2;
      await db.execute(sql`UPDATE users SET xp = GREATEST(0, xp + ${delta}) WHERE id = ${updated.user_id}`);

      // notify author on upvote
      if (v === 1 && updated.user_id !== me.id) {
        await db.execute(sql`
          INSERT INTO notifications (user_id, type, actor_id, meme_id, title, body)
          VALUES (${updated.user_id}, 'reaction', ${me.id}, ${memeId}, 'New reaction', '@' || (SELECT handle FROM users WHERE id = ${me.id}) || ' upvoted your meme')
        `);
      }
    }
    await db.execute(sql`UPDATE challenge_entries SET votes = ${updated?.score ?? 0} WHERE meme_id = ${memeId}`);

    return NextResponse.json({
      score: updated?.score ?? 0,
      upvotes: updated?.upvotes ?? 0,
      downvotes: updated?.downvotes ?? 0,
      userVote: v,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "vote failed" }, { status: 500 });
  }
}
