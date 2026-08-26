import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

/** Lists conversations: one row per person the current user has exchanged any message with, newest first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: { sender: true, recipient: true },
  });

  const conversations = new Map<
    string,
    { otherId: string; otherName: string; lastMessage: string; lastAt: Date; unreadCount: number }
  >();

  for (const m of messages) {
    const otherId = m.senderId === user.id ? m.recipientId : m.senderId;
    const otherName = m.senderId === user.id ? m.recipient.name : m.sender.name;
    const existing = conversations.get(otherId);
    const isUnread = m.recipientId === user.id && !m.readAt;
    if (!existing) {
      conversations.set(otherId, { otherId, otherName, lastMessage: m.body, lastAt: m.createdAt, unreadCount: isUnread ? 1 : 0 });
    } else if (isUnread) {
      existing.unreadCount += 1;
    }
  }

  return NextResponse.json(Array.from(conversations.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime()));
}
