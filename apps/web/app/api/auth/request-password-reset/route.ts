import { NextResponse } from "next/server";
import { prisma } from "@housing-app/db";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendMail, APP_URL } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

const GENERIC_MESSAGE = "If an account with that email exists, we've sent a password reset link.";

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "request-password-reset", 5, 15 * 60 * 1000);
  if (limited) return limited;

  const { email } = (await request.json()) as { email?: string };
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  // Always return the same message whether or not the account exists, so
  // this endpoint can't be used to enumerate registered emails.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await createPasswordResetToken(user.id);
    await sendMail(user.email, "Reset your password", `Reset your password: ${APP_URL}/reset-password/${token}\nThis link expires in 1 hour.`);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
