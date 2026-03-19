// JSON formatter.
import type { ReachabilityResult } from "../vuln/types.js";

export function formatJson(results: ReachabilityResult[]): string {
  const summary = {
    reachable: results.filter((result) => result.status === "REACHABLE").length,
    unreachable: results.filter((result) => result.status === "UNREACHABLE").length,
    unknown: results.filter((result) => result.status === "UNKNOWN").length,
  };

  return JSON.stringify({ summary, results }, null, 2);
}
