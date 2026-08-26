import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: params.userId } });
  return NextResponse.json({ ok: true });
}
