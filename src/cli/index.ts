#!/usr/bin/env node
// Commander root command setup.
import { Command } from "commander";
import { createRequire } from "node:module";

import { graphCommand } from "./graph.js";
import { scanCommand } from "./scan.js";
import { traceCommand } from "./trace.js";

const require = createRequire(__filename);
const packageJson = require("../../package.json") as { version: string };

export const program = new Command()
  .name("reachable")
  .version(packageJson.version)
  .description("Vulnerability reachability analyzer for Node.js projects")
  .addCommand(scanCommand)
  .addCommand(traceCommand)
  .addCommand(graphCommand);

if (process.argv[1]) {
  program.parse(process.argv);
}
