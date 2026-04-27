import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  publicUser,
  type AuthedRequest,
} from "../lib/auth";

const router: IRouter = Router();

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function validateUsername(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = asString(raw).trim().toLowerCase();
  if (v.length < 3 || v.length > 20) return { ok: false, error: "Username must be 3-20 characters" };
  if (!USERNAME_RE.test(v)) return { ok: false, error: "Letters, numbers and underscores only" };
  return { ok: true, value: v };
}

function validatePassword(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = asString(raw);
  if (v.length < 6 || v.length > 100) return { ok: false, error: "Password must be 6-100 characters" };
  return { ok: true, value: v };
}

function validateDisplayName(raw: unknown, fallback: string): string {
  const v = asString(raw).trim();
  if (v.length === 0) return fallback;
  return v.slice(0, 30);
}

function validateAvatar(raw: unknown, fallback: string): string {
  const v = asString(raw);
  if (v.length === 0 || v.length > 30) return fallback;
  return v;
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const u = validateUsername(req.body?.username);
  if (!u.ok) { res.status(400).json({ error: u.error }); return; }
  const p = validatePassword(req.body?.password);
  if (!p.ok) { res.status(400).json({ error: p.error }); return; }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, u.value))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const displayName = validateDisplayName(req.body?.displayName, u.value);
  const avatar = validateAvatar(req.body?.avatar, "⚾️");

  const [user] = await db
    .insert(usersTable)
    .values({
      username: u.value,
      passwordHash: hashPassword(p.value),
      displayName,
      avatar,
    })
    .returning();
  if (!user) {
    res.status(500).json({ error: "Could not create account" });
    return;
  }
  setSessionCookie(res, user.id);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const username = asString(req.body?.username).trim().toLowerCase();
  const password = asString(req.body?.password);
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Wrong username or password" });
    return;
  }
  setSessionCookie(res, user.id);
  res.json({ user: publicUser(user) });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/auth/me", async (req: AuthedRequest, res): Promise<void> => {
  if (!req.user) {
    res.status(200).json({ user: null });
    return;
  }
  res.json({ user: publicUser(req.user) });
});

router.put("/auth/me", async (req: AuthedRequest, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }
  const displayName = validateDisplayName(req.body?.displayName, req.user.displayName);
  const avatar = validateAvatar(req.body?.avatar, req.user.avatar);
  const [updated] = await db
    .update(usersTable)
    .set({ displayName, avatar })
    .where(eq(usersTable.id, req.user.id))
    .returning();
  if (!updated) {
    res.status(500).json({ error: "Could not update profile" });
    return;
  }
  res.json({ user: publicUser(updated) });
});

export default router;
