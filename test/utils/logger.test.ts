import { describe, expect, it } from "vitest";

import { logger, setVerbose } from "../../src/utils/logger.js";

describe("utils/logger", () => {
  it("switches the logger to debug mode when verbose is enabled", () => {
    const originalLevel = logger.level;

    setVerbose(true);
    expect(logger.level).toBe("debug");

    logger.level = originalLevel;
  });

  it("restores the default log level when verbose is disabled", () => {
    const originalLevel = logger.level;

    setVerbose(false);
    expect(logger.level).toBe(process.env.LOG_LEVEL ?? "warn");

    logger.level = originalLevel;
  });
});
