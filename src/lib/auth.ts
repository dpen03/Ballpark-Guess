import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

const COOKIE_NAME = "bp_uid";
const SCRYPT_KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function setSessionCookie(res: Response, userId: string) {
  res.cookie(COOKIE_NAME, userId, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function getSessionUserId(req: Request): string | null {
  const id = req.signedCookies?.[COOKIE_NAME];
  return typeof id === "string" && id.length > 0 ? id : null;
}

export interface AuthedRequest extends Request {
  user?: User;
}

/** Looks up the current user from the signed cookie and attaches to req.user. Never blocks. */
export async function attachUser(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const id = getSessionUserId(req);
  if (!id) return next();
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (user) req.user = user;
  } catch {
    /* ignore -- treat as anonymous */
  }
  next();
}

/** Hard-requires an authenticated user, otherwise 401. */
export function requireUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  next();
}

export function publicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
  };
}
