import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaigns, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: campaigns.id,
      brandUserId: campaigns.brandUserId,
      brandName: campaigns.brandName,
      brandLogoEmoji: campaigns.brandLogoEmoji,
      title: campaigns.title,
      brief: campaigns.brief,
      category: campaigns.category,
      budgetMin: campaigns.budgetMin,
      budgetMax: campaigns.budgetMax,
      deadline: campaigns.deadline,
      status: campaigns.status,
      applicants: campaigns.applicants,
      requirements: campaigns.requirements,
      createdAt: campaigns.createdAt,
      handle: users.handle,
      verified: users.verified,
    })
    .from(campaigns)
    .innerJoin(users, eq(campaigns.brandUserId, users.id))
    .orderBy(desc(campaigns.createdAt))
    .limit(60);
  return NextResponse.json({
    campaigns: rows.map((r) => ({
      ...r,
      deadline: r.deadline.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandUserId, brandName, brandLogoEmoji, title, brief, category, budgetMin, budgetMax, deadline, requirements } = body;
    if (!brandUserId || !title || !brief) {
      return NextResponse.json({ error: "brandUserId, title, brief required" }, { status: 400 });
    }
    const [c] = await db
      .insert(campaigns)
      .values({
        brandUserId,
        brandName: String(brandName ?? "Brand").slice(0, 60),
        brandLogoEmoji: String(brandLogoEmoji ?? "🏢").slice(0, 8),
        title: String(title).slice(0, 120),
        brief: String(brief).slice(0, 3000),
        category: String(category ?? "General").slice(0, 40),
        budgetMin: Number(budgetMin ?? 100),
        budgetMax: Number(budgetMax ?? 1000),
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 14 * 86400000),
        requirements: String(requirements ?? "").slice(0, 2000),
        status: "open",
      })
      .returning();
    return NextResponse.json({ campaign: c }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
