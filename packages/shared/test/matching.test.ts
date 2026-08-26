import { describe, expect, it } from "vitest";
import { generateMatches, type NeedLike, type CandidateInput } from "../src/matching";
import type { Edge } from "../src/graph";

function need(overrides: Partial<NeedLike> & { userId: string }): NeedLike {
  return {
    city: "New York, NY",
    neighborhoods: "Bushwick",
    budgetMin: 1200,
    budgetMax: 1800,
    moveInDate: new Date("2026-09-25"),
    urgency: "URGENT",
    roomType: "ANY",
    visibility: 3,
    ...overrides,
  };
}

// Mirrors the seed scenario: Nathyn knows Alice, Bob, Cara and Dana, but the
// friends don't know each other. Erin and Frank are compatible on paper but
// have zero connections into the network.
const edges: Edge[] = [
  ["nathyn", "alice"],
  ["nathyn", "bob"],
  ["nathyn", "cara"],
  ["nathyn", "dana"],
];

describe("generateMatches", () => {
  it("surfaces friends-of-friends who aren't directly connected, crediting the connector", () => {
    const aliceNeed = need({ userId: "alice" });
    const candidates: CandidateInput[] = [
      { need: need({ userId: "bob" }), vouchCount: 0 },
      { need: need({ userId: "cara" }), vouchCount: 0 },
    ];

    const matches = generateMatches({ viewerId: "alice", viewerNeed: aliceNeed, candidates, edges });

    expect(matches.map((m) => m.userId).sort()).toEqual(["bob", "cara"]);
    for (const match of matches) {
      expect(match.degree).toBe(2);
      expect(match.via).toBe("nathyn");
    }
  });

  it("never surfaces a compatible stranger with no path into the network", () => {
    const aliceNeed = need({ userId: "alice" });
    const candidates: CandidateInput[] = [
      { need: need({ userId: "erin" }), vouchCount: 0 }, // identical stats to bob/cara, but no edges at all
    ];

    const matches = generateMatches({ viewerId: "alice", viewerNeed: aliceNeed, candidates, edges });

    expect(matches).toHaveLength(0);
  });

  it("hides a candidate who set their own visibility narrower than the actual degree", () => {
    const aliceNeed = need({ userId: "alice" });
    const candidates: CandidateInput[] = [
      { need: need({ userId: "bob", visibility: 1 }), vouchCount: 0 }, // only direct friends should see Bob; Alice is degree 2
    ];

    const matches = generateMatches({ viewerId: "alice", viewerNeed: aliceNeed, candidates, edges });

    expect(matches).toHaveLength(0);
  });

  it("ranks closer, better-vouched, more compatible candidates higher", () => {
    const viewerNeed = need({ userId: "nathyn", budgetMin: 1400, budgetMax: 1600 });
    const candidates: CandidateInput[] = [
      // direct friend, well vouched, good budget overlap
      { need: need({ userId: "alice", budgetMin: 1400, budgetMax: 1600 }), vouchCount: 3 },
      // friend-of-friend (via alice would require an edge alice-dana; here dana is direct too, so use bob at degree 1 but poor budget overlap)
      { need: need({ userId: "bob", budgetMin: 2500, budgetMax: 3000 }), vouchCount: 0 },
    ];

    const matches = generateMatches({ viewerId: "nathyn", viewerNeed, candidates, edges });

    expect(matches[0].userId).toBe("alice");
    expect(matches[0].score).toBeGreaterThan(matches[1].score);
  });

  it("excludes candidates outside the requested city", () => {
    const aliceNeed = need({ userId: "alice", city: "New York, NY" });
    const candidates: CandidateInput[] = [{ need: need({ userId: "bob", city: "Los Angeles, CA" }), vouchCount: 0 }];

    const matches = generateMatches({ viewerId: "alice", viewerNeed: aliceNeed, candidates, edges });

    expect(matches).toHaveLength(0);
  });
});
