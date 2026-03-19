// cosmiconfig loader for .reachablerc.
import { cosmiconfig } from "cosmiconfig";

import { ConfigSchema, getDefaultConfig, type ReachableConfig } from "./types.js";

export async function loadConfig(cwd: string): Promise<ReachableConfig> {
  const explorer = cosmiconfig("reachable");
  const result = await explorer.search(cwd);

  if (!result) {
    return getDefaultConfig();
  }

  return ConfigSchema.parse(result.config);
}
