// `reachable graph <file>` subcommand.
import { Command } from "commander";

export const graphCommand = new Command("graph")
  .description("Inspect imports and exports for a source file")
  .argument("<file>", "Source file to inspect")
  .action(() => {
    // Stub until graph implementation is added in Phase 6.
  });
