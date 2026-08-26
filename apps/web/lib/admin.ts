import type { User } from "@housing-app/db";

/**
 * Minimal admin gate for the MVP: one operator email set via env var. Real
 * moderation tooling (roles, audit log, multiple admins) is a fast-follow,
 * not a blocker for having somewhere reports actually go.
 */
export function isAdmin(user: Pick<User, "email"> | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!adminEmail && !!user && user.email.toLowerCase() === adminEmail.toLowerCase();
}
