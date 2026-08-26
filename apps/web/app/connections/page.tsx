import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import ConnectionsClient from "@/components/ConnectionsClient";
import InviteLinkCard from "@/components/InviteLinkCard";

export default async function ConnectionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const requests = await prisma.connectionRequest.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: { userA: true, userB: true },
    orderBy: { createdAt: "desc" },
  });

  const shaped = requests.map((r) => {
    const other = r.userAId === user.id ? r.userB : r.userA;
    const direction = r.userAId === user.id ? ("outgoing" as const) : ("incoming" as const);
    return {
      id: r.id,
      status: r.status as "PENDING" | "ACCEPTED",
      direction,
      other: { id: other.id, name: other.name, email: other.email },
    };
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">Your network</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Add people you actually know. Matches only ever surface through these connections — direct friends, or
          friends of friends.
        </p>
      </div>
      <InviteLinkCard inviteCode={user.inviteCode} />
      <ConnectionsClient initialConnections={shaped} />
    </div>
  );
}
