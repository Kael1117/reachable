// `reachable graph <file>` subcommand.
import { Command } from "commander";

import path from "node:path";

import { collectSourceFiles, detectEntryPoints } from "../analyzer.js";
import { buildGraph } from "../graph/builder.js";
import { isNodeReachable } from "../graph/traversal.js";
import { parseFile } from "../parser/index.js";

type GraphOptions = {
  cwd?: string;
  entry?: string[];
};

export const graphCommand = new Command("graph")
  .description("Inspect imports and exports for a source file")
  .argument("<file>", "Source file to inspect")
  .option("--entry <files...>", "Entry point files")
  .option("--cwd <path>", "Project root directory", process.cwd())
  .action(async (file: string, options: GraphOptions) => {
    const cwd = options.cwd ?? process.cwd();
    const absoluteFile = path.resolve(cwd, file);
    const parsed = parseFile(absoluteFile);
    const entryPoints = detectEntryPoints(cwd, options.entry);
    const graph = buildGraph(collectSourceFiles(cwd), entryPoints, cwd);
    const relativeFile = path.relative(cwd, absoluteFile).replace(/\\/g, "/");

    const lines = [
      `File: ${relativeFile}`,
      "",
      "Imports:",
      ...parsed.imports.map((entry) => `- ${entry.kind}: ${entry.source}`),
      "",
      "Exports:",
      ...parsed.exports.map((entry) => {
        const nodeId = `${relativeFile}::${entry.name}`;
        return `- ${entry.name} (${isNodeReachable(graph, nodeId) ? "reachable" : "unreachable"})`;
      }),
    ];

    process.stdout.write(`${lines.join("\n")}\n`);
    process.exitCode = 0;
  });
