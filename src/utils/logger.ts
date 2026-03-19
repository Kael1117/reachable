// pino logger with --verbose flag.
import pino from "pino";

const defaultLevel = process.env.LOG_LEVEL ?? "warn";
const transport = process.stdout.isTTY
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: !process.env.NO_COLOR,
      },
    })
  : undefined;

export const logger = pino(
  {
    level: defaultLevel,
  },
  transport,
);

export function setVerbose(val: boolean): void {
  logger.level = val ? "debug" : defaultLevel;
}
