import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import { canMessage } from "@/lib/messages";
import MessageThread from "@/components/MessageThread";

export default async function MessageThreadPage({ params }: { params: { userId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const other = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!other) notFound();

  const allowed = await canMessage(user.id, params.userId);
  if (!allowed) {
    return (
      <div className="mx-auto max-w-md text-center text-neutral-600">
        <p>You can&apos;t message {other.name} yet — that unlocks once you&apos;re connected or you both mark each other interested.</p>
      </div>
    );
  }

  return <MessageThread otherId={other.id} otherName={other.name} viewerId={user.id} />;
}
