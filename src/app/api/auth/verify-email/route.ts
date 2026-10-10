import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const rows = await db.select().from(users).where(eq(users.verifyToken, token)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  await db.execute(sql`UPDATE users SET email_verified = TRUE, verify_token = NULL WHERE id = ${rows[0].id}`);
  return NextResponse.json({ ok: true, user: { id: rows[0].id, handle: rows[0].handle } });
}
