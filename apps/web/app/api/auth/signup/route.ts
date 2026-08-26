import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@housing-app/db";
import { generateInviteCode } from "@housing-app/shared";
import { setSessionCookie } from "@/lib/auth";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendMail, APP_URL } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "signup", 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await request.json();
  const { name, email, password, city, inviteCode, agreedToTerms } = body as {
    name?: string;
    email?: string;
    password?: string;
    city?: string;
    inviteCode?: string;
    agreedToTerms?: boolean;
  };

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!agreedToTerms) {
    return NextResponse.json({ error: "You must agree to the Terms of Service and Privacy Policy." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  // Signing up through someone's personal invite link is them vouching for
  // you directly, so it skips the normal connection request/accept step.
  const inviter = inviteCode ? await prisma.user.findUnique({ where: { inviteCode } }) : null;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      city,
      inviteCode: generateInviteCode(),
      invitedById: inviter?.id,
      termsAcceptedAt: new Date(),
    },
  });

  if (inviter) {
    await prisma.connectionRequest.create({
      data: { userAId: inviter.id, userBId: user.id, status: "ACCEPTED", respondedAt: new Date() },
    });
  }

  const verificationToken = await createEmailVerificationToken(user.id);
  await sendMail(user.email, "Verify your email", `Verify your email: ${APP_URL}/verify-email/${verificationToken}`);

  const token = setSessionCookie(user.id);
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, token });
}
