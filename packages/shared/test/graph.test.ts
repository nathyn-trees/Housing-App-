import { describe, expect, it } from "vitest";
import { computeDegrees } from "../src/graph";

describe("computeDegrees", () => {
  const edges: [string, string][] = [
    ["nathyn", "alice"],
    ["nathyn", "bob"],
    ["nathyn", "cara"],
    ["nathyn", "dana"],
    ["dana", "farAway"], // 3 hops from alice via nathyn -> dana -> farAway
  ];

  it("marks direct connections as degree 1 with no connector", () => {
    const degrees = computeDegrees(edges, "nathyn", 3);
    expect(degrees.get("alice")).toEqual({ degree: 1, via: null });
  });

  it("marks friends-of-friends as degree 2, connected via the shared friend", () => {
    const degrees = computeDegrees(edges, "alice", 3);
    expect(degrees.get("bob")).toEqual({ degree: 2, via: "nathyn" });
    expect(degrees.get("dana")).toEqual({ degree: 2, via: "nathyn" });
  });

  it("respects maxDepth, excluding anyone farther out", () => {
    const degrees = computeDegrees(edges, "alice", 2);
    expect(degrees.has("farAway")).toBe(false);
  });

  it("includes nodes right at maxDepth when it's raised", () => {
    const degrees = computeDegrees(edges, "alice", 3);
    expect(degrees.get("farAway")).toEqual({ degree: 3, via: "dana" });
  });

  it("omits users with no path at all", () => {
    const degrees = computeDegrees(edges, "alice", 3);
    expect(degrees.has("totalStranger")).toBe(false);
  });
});
