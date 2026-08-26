import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import { computeDegrees, type Edge } from "@housing-app/shared";
import { canMessage } from "@/lib/messages";
import { isBlocked } from "@/lib/blocks";

/** Same data the web profile page (RSC) computes inline, exposed as JSON for the mobile client. */
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const target = await prisma.user.findUnique({ where: { id: params.userId }, include: { invitedBy: true } });
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (await isBlocked(viewer.id, target.id)) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const connections = await prisma.connectionRequest.findMany({ where: { status: "ACCEPTED" } });
  const edges: Edge[] = connections.map((c) => [c.userAId, c.userBId]);
  const degrees = computeDegrees(edges, viewer.id, 3);
  const degreeInfo = degrees.get(target.id);

  if (!degreeInfo) {
    return NextResponse.json({ error: "This person isn't in your network yet." }, { status: 403 });
  }

  const via = degreeInfo.via ? await prisma.user.findUnique({ where: { id: degreeInfo.via } }) : null;
  const vouches = await prisma.vouch.findMany({ where: { targetId: target.id }, include: { voucher: true } });
  const alreadyVouched = vouches.some((v) => v.voucherId === viewer.id);
  const messagingAllowed = await canMessage(viewer.id, target.id);

  return NextResponse.json({
    id: target.id,
    name: target.name,
    bio: target.bio,
    degree: degreeInfo.degree,
    via: via ? { id: via.id, name: via.name } : null,
    invitedBy: target.invitedBy ? { id: target.invitedBy.id, name: target.invitedBy.name } : null,
    vouches: vouches.map((v) => ({ id: v.id, voucherName: v.voucher.name, note: v.note })),
    canVouch: degreeInfo.degree === 1 && !alreadyVouched,
    canMessage: messagingAllowed,
  });
}
