import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
    orderBy: { createdAt: "desc" },
    include: { sender: true, recipient: true },
  });

  const conversations = new Map<string, { otherId: string; otherName: string; lastMessage: string; lastAt: Date; unreadCount: number }>();
  for (const m of messages) {
    const otherId = m.senderId === user.id ? m.recipientId : m.senderId;
    const otherName = m.senderId === user.id ? m.recipient.name : m.sender.name;
    const isUnread = m.recipientId === user.id && !m.readAt;
    const existing = conversations.get(otherId);
    if (!existing) {
      conversations.set(otherId, { otherId, otherName, lastMessage: m.body, lastAt: m.createdAt, unreadCount: isUnread ? 1 : 0 });
    } else if (isUnread) {
      existing.unreadCount += 1;
    }
  }
  const list = Array.from(conversations.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Messages</h1>
      {list.length === 0 ? (
        <p className="text-neutral-600">
          Nothing here yet. Messaging unlocks once you&apos;re connected with someone, or you both mark each other
          interested on a match.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.otherId}>
              <Link
                href={`/messages/${c.otherId}`}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 hover:border-brand-300"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-700">{c.otherName}</p>
                  <p className="truncate text-sm text-neutral-500">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="ml-3 shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">{c.unreadCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
