import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, users, campaigns } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  const memerId = searchParams.get("memerId");
  let query = db
    .select({
      id: applications.id,
      campaignId: applications.campaignId,
      memerId: applications.memerId,
      pitch: applications.pitch,
      portfolioUrl: applications.portfolioUrl,
      status: applications.status,
      createdAt: applications.createdAt,
      handle: users.handle,
      displayName: users.displayName,
      avatarEmoji: users.avatarEmoji,
      avatarColor: users.avatarColor,
      verified: users.verified,
      xp: users.xp,
      level: users.level,
    })
    .from(applications)
    .innerJoin(users, eq(applications.memerId, users.id))
    .orderBy(desc(applications.createdAt))
    .limit(100);
  if (campaignId) {
    const rows = await db
      .select({
        id: applications.id,
        campaignId: applications.campaignId,
        memerId: applications.memerId,
        pitch: applications.pitch,
        portfolioUrl: applications.portfolioUrl,
        status: applications.status,
        createdAt: applications.createdAt,
        handle: users.handle,
        displayName: users.displayName,
        avatarEmoji: users.avatarEmoji,
        avatarColor: users.avatarColor,
        verified: users.verified,
        xp: users.xp,
        level: users.level,
      })
      .from(applications)
      .innerJoin(users, eq(applications.memerId, users.id))
      .where(eq(applications.campaignId, campaignId))
      .orderBy(desc(applications.createdAt))
      .limit(100);
    return NextResponse.json({ applications: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
  }
  if (memerId) {
    const rows = await db
      .select({
        id: applications.id,
        campaignId: applications.campaignId,
        memerId: applications.memerId,
        pitch: applications.pitch,
        portfolioUrl: applications.portfolioUrl,
        status: applications.status,
        createdAt: applications.createdAt,
        title: campaigns.title,
        brandName: campaigns.brandName,
        brandLogoEmoji: campaigns.brandLogoEmoji,
        budgetMin: campaigns.budgetMin,
        budgetMax: campaigns.budgetMax,
      })
      .from(applications)
      .innerJoin(campaigns, eq(applications.campaignId, campaigns.id))
      .where(eq(applications.memerId, memerId))
      .orderBy(desc(applications.createdAt))
      .limit(100);
    return NextResponse.json({ applications: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
  }
  const rows = await query;
  return NextResponse.json({ applications: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}

export async function POST(req: NextRequest) {
  try {
    const { campaignId, memerId, pitch, portfolioUrl } = await req.json();
    if (!campaignId || !memerId || !pitch?.trim()) {
      return NextResponse.json({ error: "campaignId, memerId, pitch required" }, { status: 400 });
    }
    const [a] = await db
      .insert(applications)
      .values({
        campaignId,
        memerId,
        pitch: String(pitch).slice(0, 1000),
        portfolioUrl: String(portfolioUrl ?? "").slice(0, 500),
      })
      .returning();
    await db.execute(sql`UPDATE campaigns SET applicants = applicants + 1 WHERE id = ${campaignId}`);
    await db.execute(sql`UPDATE users SET xp = xp + 20 WHERE id = ${memerId}`);
    return NextResponse.json({ application: a }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !["pending", "accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    await db.update(applications).set({ status }).where(eq(applications.id, id));
    if (status === "accepted") {
      const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
      if (rows[0]) {
        await db.execute(sql`UPDATE users SET xp = xp + 300 WHERE id = ${rows[0].memerId}`);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
