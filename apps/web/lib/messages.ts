import { prisma } from "@housing-app/db";
import { isBlocked } from "@/lib/blocks";

/**
 * Messaging is unlocked between two people once there's an actual reason to
 * talk: they're a direct (accepted) connection, or they've each independently
 * marked the other "interested" on the match feed ("it's a match"). Either
 * side blocking the other overrides both.
 */
export async function canMessage(userAId: string, userBId: string): Promise<boolean> {
  if (userAId === userBId) return false;
  if (await isBlocked(userAId, userBId)) return false;

  const connection = await prisma.connectionRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { userAId, userBId },
        { userAId: userBId, userBId: userAId },
      ],
    },
  });
  if (connection) return true;

  const [sortedA, sortedB] = [userAId, userBId].sort();
  const actions = await prisma.matchAction.findMany({
    where: { userAId: sortedA, userBId: sortedB, action: "INTERESTED" },
  });
  const actorIds = new Set(actions.map((a) => a.actorId));
  return actorIds.has(userAId) && actorIds.has(userBId);
}
