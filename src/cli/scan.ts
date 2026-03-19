// `reachable scan` subcommand.
import { Command } from "commander";

export const scanCommand = new Command("scan")
  .description("Scan a project for reachable vulnerabilities")
  .action(() => {
    // Stub until scan implementation is added in Phase 6.
  });
