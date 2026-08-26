import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { action } = (await request.json()) as { action?: "accept" | "decline" };
  const connection = await prisma.connectionRequest.findUnique({ where: { id: params.id } });
  if (!connection) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (connection.userBId !== user.id) {
    return NextResponse.json({ error: "Only the recipient can respond to this request." }, { status: 403 });
  }

  if (action === "accept") {
    const updated = await prisma.connectionRequest.update({
      where: { id: params.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  await prisma.connectionRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
