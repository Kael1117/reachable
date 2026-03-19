// BFS/DFS from entry points.
import { logger } from "../utils/logger.js";
import type { CallGraph } from "./types.js";

function adjacencyList(graph: CallGraph): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const edge of graph.edges) {
    const neighbors = adjacency.get(edge.from) ?? [];
    neighbors.push(edge.to);
    adjacency.set(edge.from, neighbors);
  }

  return adjacency;
}

export function findReachableNodes(graph: CallGraph, maxDepth: number): Set<string> {
  const adjacency = adjacencyList(graph);
  const reachable = new Set<string>();
  const queue = graph.entryPoints.map((entryPoint) => ({ id: entryPoint, depth: 0 }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current.id)) {
      continue;
    }

    if (current.depth > maxDepth) {
      logger.warn({ nodeId: current.id, maxDepth }, "Traversal depth exceeded");
      continue;
    }

    reachable.add(current.id);

    for (const neighbor of adjacency.get(current.id) ?? []) {
      queue.push({ id: neighbor, depth: current.depth + 1 });
    }
  }

  return reachable;
}

export function findPathTo(graph: CallGraph, targetNodeId: string): string[] | null {
  if (!graph.nodes.has(targetNodeId)) {
    return null;
  }

  const adjacency = adjacencyList(graph);
  const queue = [...graph.entryPoints];
  const visited = new Set<string>();
  const previous = new Map<string, string | null>();

  for (const entryPoint of graph.entryPoints) {
    previous.set(entryPoint, null);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (current === targetNodeId) {
      const path: string[] = [];
      let cursor: string | null = current;
      while (cursor) {
        path.unshift(cursor);
        cursor = previous.get(cursor) ?? null;
      }
      return path;
    }

    for (const neighbor of adjacency.get(current) ?? []) {
      if (!previous.has(neighbor)) {
        previous.set(neighbor, current);
      }
      queue.push(neighbor);
    }
  }

  return null;
}

export function isNodeReachable(graph: CallGraph, nodeId: string): boolean {
  return findPathTo(graph, nodeId) !== null;
}
