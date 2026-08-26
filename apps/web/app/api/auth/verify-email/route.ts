import { NextResponse } from "next/server";
import { prisma } from "@housing-app/db";
import { consumeEmailVerificationToken } from "@/lib/tokens";

export async function POST(request: Request) {
  const { token } = (await request.json()) as { token?: string };
  if (!token) return NextResponse.json({ error: "Token is required." }, { status: 400 });

  const userId = await consumeEmailVerificationToken(token);
  if (!userId) return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });

  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
