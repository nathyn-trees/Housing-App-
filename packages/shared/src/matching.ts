import { type Edge, computeDegrees } from "./graph";

export type Urgency = "FLEXIBLE" | "SOON" | "URGENT";
export type RoomType = "ANY" | "PRIVATE_ROOM" | "SHARED_ROOM" | "ENTIRE_PLACE";
export type FrequencyLevel = "NEVER" | "RARELY" | "SOMETIMES" | "OFTEN" | "ALWAYS";
export type SocialStyle = "INTROVERT" | "AMBIVERT" | "EXTROVERT";

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

/**
 * Personal compatibility traits, independent of any specific housing search —
 * these describe the person, not the listing. Optional: a candidate missing
 * a profile scores neutral (0.5) on this dimension rather than being
 * penalized for not having filled it out.
 */
export interface LifestyleLike {
  /** 1 (relaxed) – 5 (very tidy) */
  cleanliness: number;
  timeAtHome: FrequencyLevel;
  hostingGuests: FrequencyLevel;
  socialStyle: SocialStyle;
}

export interface MatchBreakdown {
  budget: number;
  location: number;
  timeline: number;
  roomType: number;
  trust: number;
  lifestyle: number;
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
  lifestyle?: LifestyleLike;
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
  viewerLifestyle?: LifestyleLike;
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

const FREQUENCY_ORDER: FrequencyLevel[] = ["NEVER", "RARELY", "SOMETIMES", "OFTEN", "ALWAYS"];
const SOCIAL_STYLE_ORDER: SocialStyle[] = ["INTROVERT", "AMBIVERT", "EXTROVERT"];

function ordinalCloseness<T>(order: T[], a: T, b: T): number {
  const maxIndex = order.length - 1;
  return 1 - Math.abs(order.indexOf(a) - order.indexOf(b)) / maxIndex;
}

const NEUTRAL_LIFESTYLE_SCORE = 0.5;

/** Blends cleanliness, time-at-home, hosting frequency, and social style into one 0–1 compatibility score. Missing on either side → neutral, so an incomplete profile is never penalized. */
export function lifestyleScore(a?: LifestyleLike, b?: LifestyleLike): number {
  if (!a || !b) return NEUTRAL_LIFESTYLE_SCORE;
  const cleanliness = 1 - Math.abs(a.cleanliness - b.cleanliness) / 4;
  const timeAtHome = ordinalCloseness(FREQUENCY_ORDER, a.timeAtHome, b.timeAtHome);
  const hostingGuests = ordinalCloseness(FREQUENCY_ORDER, a.hostingGuests, b.hostingGuests);
  const socialStyle = ordinalCloseness(SOCIAL_STYLE_ORDER, a.socialStyle, b.socialStyle);
  return (cleanliness + timeAtHome + hostingGuests + socialStyle) / 4;
}

const WEIGHTS = { budget: 0.25, location: 0.15, timeline: 0.15, roomType: 0.1, trust: 0.15, lifestyle: 0.2 };

export function scoreNeedPair(
  viewerNeed: NeedLike,
  candidateNeed: NeedLike,
  degree: number,
  vouchCount: number,
  viewerLifestyle?: LifestyleLike,
  candidateLifestyle?: LifestyleLike,
): { score: number; breakdown: MatchBreakdown } {
  const breakdown: MatchBreakdown = {
    budget: budgetOverlapScore(viewerNeed, candidateNeed),
    location: locationScore(viewerNeed, candidateNeed),
    timeline: timelineScore(viewerNeed, candidateNeed),
    roomType: roomTypeScore(viewerNeed, candidateNeed),
    trust: trustScore(degree, vouchCount),
    lifestyle: lifestyleScore(viewerLifestyle, candidateLifestyle),
  };
  const score =
    breakdown.budget * WEIGHTS.budget +
    breakdown.location * WEIGHTS.location +
    breakdown.timeline * WEIGHTS.timeline +
    breakdown.roomType * WEIGHTS.roomType +
    breakdown.trust * WEIGHTS.trust +
    breakdown.lifestyle * WEIGHTS.lifestyle;
  return { score: Math.round(score * 100), breakdown };
}

/**
 * Computes private match suggestions for a user: candidates are filtered to
 * people reachable within the network graph (never a stranger with zero
 * mutual connections, no matter how compatible on paper), then ranked by a
 * blend of practical fit (budget/location/timeline/room type), lifestyle
 * compatibility, and trust (closer connections and vouches score higher).
 */
export function generateMatches(params: GenerateMatchesParams): MatchCandidate[] {
  const { viewerId, viewerNeed, candidates, edges, maxDegree = 3, limit = 20, viewerLifestyle } = params;
  const degrees = computeDegrees(edges, viewerId, maxDegree);

  const results: MatchCandidate[] = [];
  for (const { need, vouchCount, lifestyle } of candidates) {
    if (need.userId === viewerId) continue;
    if (need.city !== viewerNeed.city) continue;

    const degreeInfo = degrees.get(need.userId);
    if (!degreeInfo) continue; // not reachable within maxDegree — never surfaced

    const visibilityCutoff = Math.min(maxDegree, need.visibility);
    if (degreeInfo.degree > visibilityCutoff) continue; // respects the candidate's own privacy setting

    const { score, breakdown } = scoreNeedPair(viewerNeed, need, degreeInfo.degree, vouchCount, viewerLifestyle, lifestyle);
    results.push({ userId: need.userId, degree: degreeInfo.degree, via: degreeInfo.via, score, breakdown });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
