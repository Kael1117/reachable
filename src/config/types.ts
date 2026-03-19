// Config schema validated with zod.
import { z } from "zod";

export const FailOnSchema = z.enum(["critical", "high", "moderate", "low", "all"]);

export const ConfigSchema = z.object({
  $schema: z.string().optional(),
  entry: z.array(z.string()).default([]),
  failOn: FailOnSchema.default("high"),
  ignore: z.array(z.string()).default([]),
  devPackages: z.array(z.string()).default([]),
  cache: z
    .object({
      ttlHours: z.number().int().positive().default(24),
      dir: z.string().default(".reachable-cache"),
    })
    .default({
      ttlHours: 24,
      dir: ".reachable-cache",
    }),
});

export type FailOnSeverity = z.infer<typeof FailOnSchema>;
export type ReachableConfig = z.infer<typeof ConfigSchema>;

export function getDefaultConfig(): ReachableConfig {
  return ConfigSchema.parse({});
}
