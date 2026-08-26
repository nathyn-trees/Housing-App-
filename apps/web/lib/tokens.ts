import crypto from "node:crypto";
import { prisma } from "@housing-app/db";

function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomToken();
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS) },
  });
  return token;
}

/** Verifies and consumes a reset token in one step. Returns the associated userId, or null if invalid/expired/already used. */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = randomToken();
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS) },
  });
  return token;
}

export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  await prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
