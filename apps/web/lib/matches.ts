import { prisma } from "@housing-app/db";
import { generateMatches, type CandidateInput, type NeedLike, type LifestyleLike, type MatchBreakdown } from "@housing-app/shared";
import type { Edge } from "@housing-app/shared";
import { getBlockedUserIdSet } from "@/lib/blocks";

export interface EnrichedMatch {
  userId: string;
  name: string;
  bio: string | null;
  kind: "need" | "offer";
  degree: number;
  via: { id: string; name: string } | null;
  score: number;
  breakdown: MatchBreakdown;
  vouchCount: number;
  action: "INTERESTED" | "PASSED" | null;
  need: NeedLike & { notes?: string | null; description?: string | null; rentAmount?: number };
  lifestyle: LifestyleLike | null;
  canMessage: boolean;
}

function offerToNeedLike(offer: {
  userId: string;
  city: string;
  neighborhood: string | null;
  rentAmount: number;
  availableDate: Date;
  roomType: string;
  visibility: number;
}): NeedLike {
  return {
    userId: offer.userId,
    city: offer.city,
    neighborhoods: offer.neighborhood,
    budgetMin: offer.rentAmount,
    budgetMax: offer.rentAmount,
    moveInDate: offer.availableDate,
    urgency: "FLEXIBLE",
    roomType: offer.roomType as NeedLike["roomType"],
    visibility: offer.visibility,
  };
}

function toLifestyleLike(row: { cleanliness: number; timeAtHome: string; hostingGuests: string; socialStyle: string } | null): LifestyleLike | undefined {
  if (!row) return undefined;
  return {
    cleanliness: row.cleanliness,
    timeAtHome: row.timeAtHome as LifestyleLike["timeAtHome"],
    hostingGuests: row.hostingGuests as LifestyleLike["hostingGuests"],
    socialStyle: row.socialStyle as LifestyleLike["socialStyle"],
  };
}

async function getAcceptedEdges(): Promise<Edge[]> {
  const connections = await prisma.connectionRequest.findMany({
    where: { status: "ACCEPTED" },
    select: { userAId: true, userBId: true },
  });
  return connections.map((c) => [c.userAId, c.userBId] as Edge);
}

/**
 * Computes this user's private match feed: other people's housing needs and
 * room offers, filtered to the trust graph (only reachable within a few
 * hops) and ranked by practical fit + lifestyle compatibility + connection
 * strength.
 */
export async function getMatchesForUser(viewerId: string): Promise<{
  viewerNeed: NeedLike | null;
  needStatus: "MISSING" | "ACTIVE" | "PAUSED" | "FOUND";
  matches: EnrichedMatch[];
}> {
  const viewerNeedRow = await prisma.housingNeed.findUnique({ where: { userId: viewerId } });
  if (!viewerNeedRow) {
    return { viewerNeed: null, needStatus: "MISSING", matches: [] };
  }
  if (viewerNeedRow.status !== "ACTIVE") {
    return { viewerNeed: null, needStatus: viewerNeedRow.status as "PAUSED" | "FOUND", matches: [] };
  }

  const viewerNeed: NeedLike = {
    userId: viewerNeedRow.userId,
    city: viewerNeedRow.city,
    neighborhoods: viewerNeedRow.neighborhoods,
    budgetMin: viewerNeedRow.budgetMin,
    budgetMax: viewerNeedRow.budgetMax,
    moveInDate: viewerNeedRow.moveInDate,
    urgency: viewerNeedRow.urgency as NeedLike["urgency"],
    roomType: viewerNeedRow.roomType as NeedLike["roomType"],
    visibility: viewerNeedRow.visibility,
  };

  const [edges, otherNeedsRaw, otherOffersRaw, vouchCounts, passedActions, viewerLifestyleRow, blockedUserIds, interestActions] =
    await Promise.all([
      getAcceptedEdges(),
      prisma.housingNeed.findMany({ where: { status: "ACTIVE", userId: { not: viewerId }, city: viewerNeed.city } }),
      prisma.housingOffer.findMany({ where: { status: "ACTIVE", userId: { not: viewerId }, city: viewerNeed.city } }),
      prisma.vouch.groupBy({ by: ["targetId"], _count: { targetId: true } }),
      prisma.matchAction.findMany({ where: { actorId: viewerId } }),
      prisma.lifestyleProfile.findUnique({ where: { userId: viewerId } }),
      getBlockedUserIdSet(viewerId),
      prisma.matchAction.findMany({ where: { OR: [{ userAId: viewerId }, { userBId: viewerId }], action: "INTERESTED" } }),
    ]);

  // Mutual interest ("it's a match"): both people independently marked each other interested.
  const interestActorsByOther = new Map<string, Set<string>>();
  for (const a of interestActions) {
    const otherId = a.userAId === viewerId ? a.userBId : a.userAId;
    if (!interestActorsByOther.has(otherId)) interestActorsByOther.set(otherId, new Set());
    interestActorsByOther.get(otherId)!.add(a.actorId);
  }
  const mutualInterestUserIds = new Set(
    [...interestActorsByOther.entries()].filter(([otherId, actors]) => actors.has(viewerId) && actors.has(otherId)).map(([otherId]) => otherId),
  );

  const otherNeeds = otherNeedsRaw.filter((n) => !blockedUserIds.has(n.userId));
  const otherOffers = otherOffersRaw.filter((o) => !blockedUserIds.has(o.userId));

  const candidateUserIds = [...otherNeeds.map((n) => n.userId), ...otherOffers.map((o) => o.userId)];
  const lifestyleRows = await prisma.lifestyleProfile.findMany({ where: { userId: { in: candidateUserIds } } });
  const lifestyleByUser = new Map(lifestyleRows.map((l) => [l.userId, toLifestyleLike(l)!]));
  const viewerLifestyle = toLifestyleLike(viewerLifestyleRow);

  const vouchCountByUser = new Map(vouchCounts.map((v) => [v.targetId, v._count.targetId]));
  const passedUserIds = new Set(
    passedActions
      .filter((a) => a.action === "PASSED")
      .map((a) => (a.userAId === viewerId ? a.userBId : a.userAId)),
  );
  const actionByUser = new Map(
    passedActions.map((a) => [a.userAId === viewerId ? a.userBId : a.userAId, a.action]),
  );

  const kindByUser = new Map<string, "need" | "offer">();
  const candidates: CandidateInput[] = [];

  for (const n of otherNeeds) {
    if (passedUserIds.has(n.userId)) continue;
    kindByUser.set(n.userId, "need");
    candidates.push({
      need: {
        userId: n.userId,
        city: n.city,
        neighborhoods: n.neighborhoods,
        budgetMin: n.budgetMin,
        budgetMax: n.budgetMax,
        moveInDate: n.moveInDate,
        urgency: n.urgency as NeedLike["urgency"],
        roomType: n.roomType as NeedLike["roomType"],
        visibility: n.visibility,
      },
      vouchCount: vouchCountByUser.get(n.userId) ?? 0,
      lifestyle: lifestyleByUser.get(n.userId),
    });
  }

  for (const o of otherOffers) {
    if (passedUserIds.has(o.userId)) continue;
    kindByUser.set(o.userId, "offer");
    candidates.push({
      need: offerToNeedLike(o),
      vouchCount: vouchCountByUser.get(o.userId) ?? 0,
      lifestyle: lifestyleByUser.get(o.userId),
    });
  }

  const ranked = generateMatches({ viewerId, viewerNeed, candidates, edges, maxDegree: 3, limit: 20, viewerLifestyle });

  const userIds = ranked.map((m) => m.userId);
  const viaIds = ranked.map((m) => m.via).filter((id): id is string => !!id);
  const users = await prisma.user.findMany({ where: { id: { in: [...userIds, ...viaIds] } } });
  const userById = new Map(users.map((u) => [u.id, u]));

  const rawByUser = new Map(candidates.map((c) => [c.need.userId, c.need]));
  const needRowsById = new Map(otherNeeds.map((n) => [n.userId, n]));
  const offerRowsById = new Map(otherOffers.map((o) => [o.userId, o]));

  const matches: EnrichedMatch[] = ranked.map((m) => {
    const user = userById.get(m.userId)!;
    const via = m.via ? userById.get(m.via) ?? null : null;
    const kind = kindByUser.get(m.userId)!;
    const needRow = needRowsById.get(m.userId);
    const offerRow = offerRowsById.get(m.userId);
    return {
      userId: m.userId,
      name: user.name,
      bio: user.bio,
      kind,
      degree: m.degree,
      via: via ? { id: via.id, name: via.name } : null,
      score: m.score,
      breakdown: m.breakdown,
      vouchCount: vouchCountByUser.get(m.userId) ?? 0,
      action: (actionByUser.get(m.userId) as "INTERESTED" | "PASSED" | undefined) ?? null,
      need: { ...rawByUser.get(m.userId)!, notes: needRow?.notes, description: offerRow?.description, rentAmount: offerRow?.rentAmount },
      lifestyle: lifestyleByUser.get(m.userId) ?? null,
      canMessage: m.degree === 1 || mutualInterestUserIds.has(m.userId),
    };
  });

  return { viewerNeed, needStatus: "ACTIVE", matches };
}
