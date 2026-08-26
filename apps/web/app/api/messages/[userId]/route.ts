import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import { canMessage } from "@/lib/messages";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const other = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!other) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const allowed = await canMessage(user.id, params.userId);
  if (!allowed) return NextResponse.json({ error: "You can't message this person." }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: params.userId },
        { senderId: params.userId, recipientId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { senderId: params.userId, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ other: { id: other.id, name: other.name }, messages });
}

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { body } = (await request.json()) as { body?: string };
  if (!body || !body.trim()) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  if (body.length > 2000) return NextResponse.json({ error: "Message is too long." }, { status: 400 });

  const allowed = await canMessage(user.id, params.userId);
  if (!allowed) return NextResponse.json({ error: "You can't message this person." }, { status: 403 });

  const message = await prisma.message.create({
    data: { senderId: user.id, recipientId: params.userId, body: body.trim() },
  });

  return NextResponse.json(message);
}
