export type Edge = [string, string];

export interface DegreeResult {
  degree: number;
  /** The direct connection one hop closer to the origin — who you'd say "connected via" for anyone beyond a direct friend. Null for direct (degree 1) connections. */
  via: string | null;
}

/**
 * BFS over an undirected graph of accepted connections, capped at maxDepth.
 * Returns every reachable user within maxDepth hops of `fromUserId` (excluding
 * fromUserId itself). Nodes beyond maxDepth, or in a different component
 * entirely, are simply absent from the result — that's the privacy boundary.
 */
export function computeDegrees(edges: Edge[], fromUserId: string, maxDepth = 3): Map<string, DegreeResult> {
  const adjacency = new Map<string, Set<string>>();
  for (const [a, b] of edges) {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  }

  const result = new Map<string, DegreeResult>();
  const parent = new Map<string, string>();
  const visited = new Set<string>([fromUserId]);
  let frontier = [fromUserId];
  let depth = 0;

  while (frontier.length > 0 && depth < maxDepth) {
    depth += 1;
    const next: string[] = [];
    for (const node of frontier) {
      const neighbors = adjacency.get(node);
      if (!neighbors) continue;
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        parent.set(neighbor, node);
        result.set(neighbor, { degree: depth, via: depth === 1 ? null : node });
        next.push(neighbor);
      }
    }
    frontier = next;
  }

  return result;
}
