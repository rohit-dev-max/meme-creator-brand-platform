import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  if (!handle || handle.length < 3) {
    return NextResponse.json({ available: false, reason: "too_short" });
  }
  const clean = handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const rows = await db.select().from(users).where(eq(users.handle, clean)).limit(1);
  return NextResponse.json({ available: rows.length === 0, handle: clean });
}
