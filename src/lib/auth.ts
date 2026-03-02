import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// Cookie config
export const AUTH_COOKIE_NAME = "dpos-token";
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ─────────────────────────────────────────
// Password utilities
// ─────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─────────────────────────────────────────
// JWT utilities
// ─────────────────────────────────────────

export function signToken(payload: Pick<AuthPayload, "userId" | "email">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

// ─────────────────────────────────────────
// HTTP-only cookie helper
// ─────────────────────────────────────────

export function buildAuthCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function buildClearAuthCookie(): string {
  return `${AUTH_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

// ─────────────────────────────────────────
// Request auth extraction
// ─────────────────────────────────────────

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Extract auth from either:
 * 1. Authorization: Bearer <token> header
 * 2. dpos-token HTTP-only cookie
 */
export function getAuthUser(authHeader: string | null, cookieHeader?: string | null): AuthPayload | null {
  // Try Bearer header first
  const bearerToken = extractBearerToken(authHeader);
  if (bearerToken) {
    try { return verifyToken(bearerToken); } catch { /* fall through */ }
  }

  // Fall back to cookie
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) {
      try { return verifyToken(match[1]); } catch { /* invalid */ }
    }
  }

  return null;
}

/**
 * Convenience: extract auth from a NextRequest (checks both header + cookie).
 * Use this in API route handlers.
 */
export function getAuthFromRequest(req: { headers: { get(name: string): string | null } }): AuthPayload | null {
  return getAuthUser(
    req.headers.get("authorization"),
    req.headers.get("cookie")
  );
}
