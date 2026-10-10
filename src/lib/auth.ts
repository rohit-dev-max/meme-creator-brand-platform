import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";

const SESSION_DAYS = 30;
const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "memearena-dev-secret-change-me-please-32chars!!"
);

export interface SessionUser {
  id: string;
  handle: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  bio: string;
  role: string;
  xp: number;
  level: number;
  followers: number;
  verified: boolean;
  email: string | null;
  emailVerified: boolean;
  isPro: boolean;
  isAdmin: boolean;
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(pw, hash);
  } catch {
    return false;
  }
}

async function createSession(userId: string, userAgent: string): Promise<string> {
  const token = nanoid(48);
  const tokenHash = await bcrypt.hash(token, 8);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({
    userId,
    tokenHash,
    userAgent: userAgent.slice(0, 200),
    ip: "",
    expiresAt,
  });
  return token;
}

async function setSessionCookie(token: string, expiresAt: Date, remember: boolean) {
  const cookieStore = await cookies();
  cookieStore.set("memearena_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // CSRF protection
    path: "/",
    maxAge: remember ? SESSION_DAYS * 86400 : 60 * 60 * 24, // 30d or session
    expires: remember ? expiresAt : undefined,
  });
}

export async function createSessionAndToken(userId: string, userAgent: string, remember: boolean) {
  const token = await createSession(userId, userAgent);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await setSessionCookie(token, expiresAt, remember);
  await db.execute(sql`UPDATE users SET last_login_at = NOW(), failed_logins = 0 WHERE id = ${userId}`);
  return token;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("memearena_session")?.value;
  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload?.uid) {
        await db.delete(sessions).where(eq(sessions.userId, payload.uid));
      }
    } catch { /* ignore */ }
  }
  cookieStore.delete("memearena_session");
}

export async function logoutAllDevices(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
  const cookieStore = await cookies();
  cookieStore.delete("memearena_session");
}

async function makeJwt(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<{ uid?: string } | null> {
  try {
    // session tokens are opaque nanoids; we also support short-lived JWTs
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { uid?: string };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("memearena_session")?.value;
  if (!token) return null;

  // Try JWT first
  let uid: string | undefined;
  const jwtPayload = await verifyToken(token);
  if (jwtPayload?.uid) {
    uid = jwtPayload.uid;
  } else {
    // Opaque session token: hash and look up
    const hash = await bcrypt.hash(token, 8);
    // bcrypt compare against stored hashes
    const rows = await db.select().from(sessions).where(eq(sessions.userId, sessions.userId));
    // simpler: find by exact tokenHash match is impossible (salted);
    // so we store a lookup: compare each session's hash for this token
    for (const s of rows) {
      if (new Date(s.expiresAt) > new Date()) {
        const ok = await bcrypt.compare(token, s.tokenHash);
        if (ok) {
          uid = s.userId;
          break;
        }
      }
    }
  }
  if (!uid) return null;

  const [u] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  if (!u) return null;
  return {
    id: u.id,
    handle: u.handle,
    displayName: u.displayName,
    avatarEmoji: u.avatarEmoji,
    avatarColor: u.avatarColor,
    bio: u.bio,
    role: u.role,
    xp: u.xp,
    level: u.level,
    followers: u.followers,
    verified: u.verified,
    email: u.email,
    emailVerified: u.emailVerified,
    isPro: u.isPro,
    isAdmin: u.isAdmin,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("AUTH_REQUIRED");
  return u;
}

export async function issueJwtForUser(userId: string) {
  return makeJwt(userId);
}

export function generateVerifyToken() {
  return nanoid(32);
}

export function generateResetToken() {
  return nanoid(32);
}

export async function lockAccount(userId: string) {
  const lockedUntil = new Date(Date.now() + 15 * 60000);
  await db.execute(sql`UPDATE users SET locked_until = ${lockedUntil} WHERE id = ${userId}`);
}

export async function bumpFailedLogins(userId: string): Promise<number> {
  const rows = await db.execute(sql`
    UPDATE users SET failed_logins = failed_logins + 1 WHERE id = ${userId} RETURNING failed_logins
  `);
  const count = Number((rows.rows[0] as { failed_logins: number }).failed_logins);
  if (count >= 5) {
    await lockAccount(userId);
  }
  return count;
}

export async function isAccountLocked(u: { lockedUntil: Date | null }): Promise<boolean> {
  return !!u.lockedUntil && new Date(u.lockedUntil) > new Date();
}

export function isAdult(dob: string | null | undefined): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 18;
}
