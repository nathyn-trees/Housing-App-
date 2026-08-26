import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { targetUserId, note } = (await request.json()) as { targetUserId?: string; note?: string };
  if (!targetUserId || !note) {
    return NextResponse.json({ error: "targetUserId and note are required." }, { status: 400 });
  }

  const directConnection = await prisma.connectionRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { userAId: user.id, userBId: targetUserId },
        { userAId: targetUserId, userBId: user.id },
      ],
    },
  });
  if (!directConnection) {
    return NextResponse.json({ error: "You can only vouch for a direct connection." }, { status: 403 });
  }

  const vouch = await prisma.vouch.upsert({
    where: { voucherId_targetId: { voucherId: user.id, targetId: targetUserId } },
    update: { note },
    create: { voucherId: user.id, targetId: targetUserId, note },
  });

  return NextResponse.json(vouch);
}
