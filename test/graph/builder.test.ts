import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildGraph } from "../../src/graph/builder.js";
import { logger } from "../../src/utils/logger.js";

const createdDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "reachable-graph-builder-"));
  createdDirs.push(dir);
  return dir;
}

function writeProjectFile(rootDir: string, relativePath: string, sourceText: string): string {
  const filePath = path.join(rootDir, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, sourceText, "utf8");
  return filePath;
}

afterEach(() => {
  vi.restoreAllMocks();

  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("graph/builder", () => {
  it("builds an edge when file A imports file B", () => {
    const cwd = makeTempDir();
    const fileA = writeProjectFile(
      cwd,
      path.join("src", "a.ts"),
      `
        import { helper } from "./b";
        export function run() {
          return helper();
        }
      `,
    );
    const fileB = writeProjectFile(
      cwd,
      path.join("src", "b.ts"),
      `
        export function helper() {
          return "ok";
        }
      `,
    );

    const graph = buildGraph([fileA, fileB], [fileA], cwd);

    expect(graph.edges).toContainEqual({
      from: "src/a.ts::module",
      to: "src/b.ts::module",
      importedFrom: "./b",
    });
  });

  it("warns and terminates recursion on circular imports", () => {
    const cwd = makeTempDir();
    const fileA = writeProjectFile(
      cwd,
      path.join("src", "a.ts"),
      `
        import { b } from "./b";
        export const a = b;
      `,
    );
    const fileB = writeProjectFile(
      cwd,
      path.join("src", "b.ts"),
      `
        import { a } from "./a";
        export const b = a;
      `,
    );
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => logger as never);

    const graph = buildGraph([fileA, fileB], [fileA], cwd);

    expect(graph.nodes.has("src/a.ts::module")).toBe(true);
    expect(graph.nodes.has("src/b.ts::module")).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith({ file: fileA }, "Circular import detected");
  });
});
