import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { Role } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "krishi-setu-sih2026-super-secret-jwt-key-change-in-prod";
const JWT_EXPIRY = "7d";

export interface SessionData {
  userId: string;
  role: Role;
  phone: string;
  token: string;
}

/**
 * Creates a real signed JWT token for the given user.
 */
export function createToken(userId: string, role: string, phone: string): string {
  return jwt.sign({ userId, role, phone }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Parses and verifies a JWT token. Returns null if invalid or expired.
 */
export function parseToken(token: string): { userId?: string; role?: Role; phone?: string } | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: Role; phone: string };
    return { userId: decoded.userId, role: decoded.role, phone: decoded.phone };
  } catch {
    return null;
  }
}

/**
 * Extracts the bearer token from Authorization header or cookies.
 */
function extractToken(req: Request | NextRequest): string {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
  return cookies["auth_token"] || cookies["token"] || "";
}

/**
 * Resolves the current session from a real JWT + Prisma DB lookup.
 * Returns null if token is missing, invalid, or user not found in DB.
 */
export async function getCurrentSession(
  req: Request | NextRequest
): Promise<{ user: any; profile: any } | null> {
  const token = extractToken(req);
  if (!token) return null;

  const parsed = parseToken(token);
  if (!parsed?.userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: parsed.userId },
      include: { farmerProfile: true },
    });
    if (!user) return null;
    return { user, profile: user.farmerProfile || null };
  } catch {
    return null;
  }
}
