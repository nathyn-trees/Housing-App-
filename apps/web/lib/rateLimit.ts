import { NextResponse } from "next/server";

/**
 * Minimal in-memory fixed-window rate limiter, keyed by route + client IP.
 * Good enough for a single-process MVP deployment; a real multi-instance
 * deployment needs a shared store (Redis) instead — this resets whenever the
 * process restarts and doesn't coordinate across instances.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Returns a 429 NextResponse if the caller has exceeded `limit` requests within `windowMs`, otherwise null (and records this request). */
export function checkRateLimit(request: Request, routeKey: string, limit: number, windowMs: number): NextResponse | null {
  const key = `${routeKey}:${getClientIp(request)}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  entry.count += 1;
  return null;
}
