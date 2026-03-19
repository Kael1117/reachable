// `reachable trace <package>` subcommand.
import { Command } from "commander";

export const traceCommand = new Command("trace")
  .description("Trace reachable paths to a package")
  .argument("<package>", "Package name to trace")
  .action(() => {
    // Stub until trace implementation is added in Phase 6.
  });
