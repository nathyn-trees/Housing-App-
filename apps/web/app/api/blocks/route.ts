import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const blocks = await prisma.block.findMany({ where: { blockerId: user.id }, include: { blocked: true } });
  return NextResponse.json(blocks.map((b) => ({ id: b.blocked.id, name: b.blocked.name })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { targetUserId } = (await request.json()) as { targetUserId?: string };
  if (!targetUserId) return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetUserId } },
      update: {},
      create: { blockerId: user.id, blockedId: targetUserId },
    }),
    // Blocking severs any existing connection — they shouldn't show as connected anywhere.
    prisma.connectionRequest.deleteMany({
      where: {
        OR: [
          { userAId: user.id, userBId: targetUserId },
          { userAId: targetUserId, userBId: user.id },
        ],
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
