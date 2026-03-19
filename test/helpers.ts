// Utility functions for loading test fixtures.
import { readFileSync } from "node:fs";
import path from "node:path";

export function fixturePath(...segments: string[]): string {
  return path.join(process.cwd(), "test", "fixtures", ...segments);
}

export function readFixture(...segments: string[]): string {
  return readFileSync(fixturePath(...segments), "utf8");
}
