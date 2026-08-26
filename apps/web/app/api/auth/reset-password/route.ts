import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@housing-app/db";
import { consumePasswordResetToken } from "@/lib/tokens";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "reset-password", 10, 15 * 60 * 1000);
  if (limited) return limited;

  const { token, password } = (await request.json()) as { token?: string; password?: string };
  if (!token || !password) return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const userId = await consumePasswordResetToken(token);
  if (!userId) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
