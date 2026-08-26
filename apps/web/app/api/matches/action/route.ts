import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { targetUserId, action } = (await request.json()) as {
    targetUserId?: string;
    action?: "INTERESTED" | "PASSED";
  };
  if (!targetUserId || !action) {
    return NextResponse.json({ error: "targetUserId and action are required." }, { status: 400 });
  }

  // userA/userB stored in a stable order so the unique constraint holds regardless of who acts first.
  const [userAId, userBId] = [user.id, targetUserId].sort();

  const result = await prisma.matchAction.upsert({
    where: { userAId_userBId_actorId: { userAId, userBId, actorId: user.id } },
    update: { action },
    create: { userAId, userBId, actorId: user.id, action },
  });

  return NextResponse.json(result);
}
