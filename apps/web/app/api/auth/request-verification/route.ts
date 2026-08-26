import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendMail, APP_URL } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const limited = checkRateLimit(request, "request-verification", 5, 15 * 60 * 1000);
  if (limited) return limited;

  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true });

  const token = await createEmailVerificationToken(user.id);
  await sendMail(user.email, "Verify your email", `Verify your email: ${APP_URL}/verify-email/${token}`);

  return NextResponse.json({ ok: true });
}
