import { afterEach, describe, expect, it, vi } from "vitest";

describe("cli/index", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("registers the root program metadata and subcommands", async () => {
    const originalArgv = [...process.argv];
    process.argv[1] = "";

    const [{ program }, packageJson] = await Promise.all([
      import("../../src/cli/index.js"),
      import("../../package.json"),
    ]);

    expect(program.name()).toBe("reachable");
    expect(program.description()).toBe("Vulnerability reachability analyzer for Node.js projects");
    expect(program.version()).toBe(packageJson.version);
    expect(program.commands.map((command) => command.name())).toEqual(["scan", "trace", "graph"]);

    process.argv.splice(0, process.argv.length, ...originalArgv);
  });
});
