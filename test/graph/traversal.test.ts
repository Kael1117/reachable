import { describe, expect, it } from "vitest";

import {
  findPathTo,
  findReachableNodes,
  isNodeReachable,
} from "../../src/graph/traversal.js";
import type { CallGraph, CallNode } from "../../src/graph/types.js";

function makeNode(id: string): CallNode {
  return {
    id,
    file: `${id}.ts`,
    name: id,
    line: 1,
    isEntryPoint: id === "A",
  };
}

function makeGraph(): CallGraph {
  const nodes = new Map<string, CallNode>(["A", "B", "C", "D", "isolated"].map((id) => [id, makeNode(id)]));

  return {
    nodes,
    edges: [
      { from: "A", to: "B", importedFrom: "./b" },
      { from: "B", to: "C", importedFrom: "./c" },
      { from: "C", to: "D", importedFrom: "./d" },
    ],
    entryPoints: ["A"],
  };
}

describe("graph/traversal", () => {
  it("finds nodes reachable at depth three in a linear chain", () => {
    const reachable = findReachableNodes(makeGraph(), 3);

    expect(reachable.has("D")).toBe(true);
  });

  it("returns an ordered path from the entry point to the target", () => {
    expect(findPathTo(makeGraph(), "D")).toEqual(["A", "B", "C", "D"]);
  });

  it("returns false when a node is isolated from all entry points", () => {
    expect(isNodeReachable(makeGraph(), "isolated")).toBe(false);
  });
});
