export type KmPromptFrequency = "daily" | "weekly";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function shouldRequestKmUpdate(
  lastPromptAt: string | undefined,
  frequency: KmPromptFrequency,
  now: Date = new Date(),
): boolean {
  if (!lastPromptAt) {
    return true;
  }

  const lastPromptTime = Date.parse(lastPromptAt);
  if (Number.isNaN(lastPromptTime)) {
    return true;
  }

  const interval = frequency === "daily" ? DAY_IN_MS : 7 * DAY_IN_MS;
  return now.getTime() - lastPromptTime >= interval;
}
