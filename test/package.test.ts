import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

type PackageManifest = {
  files?: string[];
  scripts?: Record<string, string>;
};

function packageManifest(): PackageManifest {
  return JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as PackageManifest;
}

describe("package manifest", () => {
  it("builds distribution files before pack or publish", () => {
    const manifest = packageManifest();

    expect(manifest.scripts?.prepack).toBe("npm run build");
    expect(manifest.files).toEqual(
      expect.arrayContaining([
        "dist/cli/index.js",
        "dist/cli/index.d.cts",
        "dist/package.json",
      ]),
    );
  });
});
