#!/usr/bin/env node
// Commander root command setup.
import { Command, CommanderError } from "commander";
import { createRequire } from "node:module";

import { graphCommand } from "./graph.js";
import { scanCommand } from "./scan.js";
import { traceCommand } from "./trace.js";
import { ReachableError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const require = createRequire(__filename);
const packageJson = require("../../package.json") as { version: string };

function writeCliError(error: unknown): void {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  const code =
    error instanceof ReachableError ? error.code : error instanceof CommanderError ? error.code : "UNHANDLED_ERROR";
  const message = logger.level === "debug" && normalizedError.stack ? normalizedError.stack : normalizedError.message;

  if (logger.level === "debug") {
    logger.error({ code }, normalizedError.message);
  }

  process.stderr.write(`${message}\n`);
  process.exit(2);
}

export const program = new Command()
  .name("reachable")
  .version(packageJson.version)
  .description("Vulnerability reachability analyzer for Node.js projects")
  .exitOverride()
  .addCommand(scanCommand)
  .addCommand(traceCommand)
  .addCommand(graphCommand);

if (process.argv[1]) {
  process.on("uncaughtException", (error) => {
    writeCliError(error);
  });

  process.on("unhandledRejection", (reason) => {
    writeCliError(reason);
  });

  void program.parseAsync(process.argv).catch((error: unknown) => {
    if (error instanceof CommanderError && error.code === "commander.helpDisplayed") {
      process.exitCode = 0;
      return;
    }

    if (error instanceof CommanderError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = error.exitCode;
      return;
    }

    writeCliError(error);
  });
}
