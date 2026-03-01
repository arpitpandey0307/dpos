import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

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
// Request auth extraction
// ─────────────────────────────────────────

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function getAuthUser(authHeader: string | null): AuthPayload | null {
  const token = extractBearerToken(authHeader);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
