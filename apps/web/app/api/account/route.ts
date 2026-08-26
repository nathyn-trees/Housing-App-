import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@housing-app/db";
import { getCurrentUser, clearSessionCookie } from "@/lib/auth";

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { password } = (await request.json()) as { password?: string };
  if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
  }

  // Cascading deletes (schema.prisma) clean up the need/offer/lifestyle,
  // connections, vouches, messages, tokens, reports, and blocks tied to this
  // account. invitedById on anyone this user invited is set to null instead
  // of cascading, so deleting an inviter doesn't wipe out their invitees.
  await prisma.user.delete({ where: { id: user.id } });
  clearSessionCookie();

  return NextResponse.json({ ok: true });
}
