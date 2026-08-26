import { type Edge, computeDegrees } from "./graph";

export type Urgency = "FLEXIBLE" | "SOON" | "URGENT";
export type RoomType = "ANY" | "PRIVATE_ROOM" | "SHARED_ROOM" | "ENTIRE_PLACE";

export interface NeedLike {
  userId: string;
  city: string;
  neighborhoods?: string | null;
  budgetMin: number;
  budgetMax: number;
  moveInDate: Date | string;
  urgency: Urgency;
  roomType: RoomType;
  /** Max degrees of separation this person is willing to be surfaced within. */
  visibility: number;
}

export interface MatchBreakdown {
  budget: number;
  location: number;
  timeline: number;
  roomType: number;
  trust: number;
}

export interface MatchCandidate {
  userId: string;
  degree: number;
  via: string | null;
  score: number;
  breakdown: MatchBreakdown;
}

export interface CandidateInput {
  need: NeedLike;
  vouchCount: number;
}

export interface GenerateMatchesParams {
  viewerId: string;
  viewerNeed: NeedLike;
  candidates: CandidateInput[];
  /** Accepted connection edges across the whole network, as [userA, userB] pairs. */
  edges: Edge[];
  /** Hard cap on degrees of separation the app will ever surface, regardless of a candidate's own visibility setting. */
  maxDegree?: number;
  limit?: number;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function budgetOverlapScore(a: NeedLike, b: NeedLike): number {
  const overlapStart = Math.max(a.budgetMin, b.budgetMin);
  const overlapEnd = Math.min(a.budgetMax, b.budgetMax);
  const overlap = Math.max(0, overlapEnd - overlapStart);
  const union = Math.max(a.budgetMax, b.budgetMax) - Math.min(a.budgetMin, b.budgetMin);
  if (union <= 0) return overlap > 0 ? 1 : 0;
  return overlap / union;
}

function locationScore(a: NeedLike, b: NeedLike): number {
  if (a.city !== b.city) return 0;
  const aHoods = (a.neighborhoods ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const bHoods = (b.neighborhoods ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (aHoods.length === 0 || bHoods.length === 0) return 0.6; // same city, no neighborhood data to compare
  const shared = aHoods.filter((h) => bHoods.includes(h));
  return shared.length > 0 ? 1 : 0.4;
}

function timelineScore(a: NeedLike, b: NeedLike): number {
  const diffDays = Math.abs(toDate(a.moveInDate).getTime() - toDate(b.moveInDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - diffDays / 60);
}

function roomTypeScore(a: NeedLike, b: NeedLike): number {
  if (a.roomType === "ANY" || b.roomType === "ANY" || a.roomType === b.roomType) return 1;
  return 0.3;
}

function trustScore(degree: number, vouchCount: number): number {
  const base = degree === 1 ? 1 : degree === 2 ? 0.7 : 0.4;
  const vouchBonus = Math.min(vouchCount * 0.1, 0.3);
  return Math.min(1, base + vouchBonus);
}

const WEIGHTS = { budget: 0.3, location: 0.2, timeline: 0.2, roomType: 0.1, trust: 0.2 };

export function scoreNeedPair(
  viewerNeed: NeedLike,
  candidateNeed: NeedLike,
  degree: number,
  vouchCount: number,
): { score: number; breakdown: MatchBreakdown } {
  const breakdown: MatchBreakdown = {
    budget: budgetOverlapScore(viewerNeed, candidateNeed),
    location: locationScore(viewerNeed, candidateNeed),
    timeline: timelineScore(viewerNeed, candidateNeed),
    roomType: roomTypeScore(viewerNeed, candidateNeed),
    trust: trustScore(degree, vouchCount),
  };
  const score =
    breakdown.budget * WEIGHTS.budget +
    breakdown.location * WEIGHTS.location +
    breakdown.timeline * WEIGHTS.timeline +
    breakdown.roomType * WEIGHTS.roomType +
    breakdown.trust * WEIGHTS.trust;
  return { score: Math.round(score * 100), breakdown };
}

/**
 * Computes private match suggestions for a user: candidates are filtered to
 * people reachable within the network graph (never a stranger with zero
 * mutual connections, no matter how compatible on paper), then ranked by a
 * blend of practical fit (budget/location/timeline/room type) and trust
 * (closer connections and vouches score higher).
 */
export function generateMatches(params: GenerateMatchesParams): MatchCandidate[] {
  const { viewerId, viewerNeed, candidates, edges, maxDegree = 3, limit = 20 } = params;
  const degrees = computeDegrees(edges, viewerId, maxDegree);

  const results: MatchCandidate[] = [];
  for (const { need, vouchCount } of candidates) {
    if (need.userId === viewerId) continue;
    if (need.city !== viewerNeed.city) continue;

    const degreeInfo = degrees.get(need.userId);
    if (!degreeInfo) continue; // not reachable within maxDegree — never surfaced

    const visibilityCutoff = Math.min(maxDegree, need.visibility);
    if (degreeInfo.degree > visibilityCutoff) continue; // respects the candidate's own privacy setting

    const { score, breakdown } = scoreNeedPair(viewerNeed, need, degreeInfo.degree, vouchCount);
    results.push({ userId: need.userId, degree: degreeInfo.degree, via: degreeInfo.via, score, breakdown });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
