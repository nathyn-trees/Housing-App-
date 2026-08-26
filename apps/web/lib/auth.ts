import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { prisma } from "@housing-app/db";

const SESSION_COOKIE = "session";

// A hardcoded fallback secret is fine for local dev but would let anyone forge
// a session cookie against a real deployment, so production must set its own.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production — refusing to start with a default/guessable secret.");
}
const JWT_SECRET = process.env.JWT_SECRET ?? "local-dev-secret-do-not-use-in-production-31f9a7";

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

/** Sets the web session cookie and returns the same token, for clients (like the mobile app) that carry it as a bearer token instead of a cookie. */
export function setSessionCookie(userId: string): string {
  const token = signSession(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

export function getUserIdFromCookie(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

function getUserIdFromAuthHeader(): string | null {
  const authHeader = headers().get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice("Bearer ".length));
}

/** Mobile clients (no browser cookie jar) authenticate with `Authorization: Bearer <token>`; the web app uses the httpOnly cookie. */
export async function getCurrentUser() {
  const userId = getUserIdFromAuthHeader() ?? getUserIdFromCookie();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
