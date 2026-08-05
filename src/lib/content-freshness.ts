const MS_PER_DAY = 86_400_000;

function parseDate(value: string): number {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) throw new TypeError("invalid ISO date");
  return parsed;
}

export function daysSinceCheck(checkedAt: string, asOf: string): number {
  const days = Math.floor(
    (parseDate(asOf) - parseDate(checkedAt)) / MS_PER_DAY,
  );
  return Math.max(0, days);
}

export function isContentStale(
  checkedAt: string | undefined,
  asOf: string,
  thresholdDays = 180,
): boolean {
  if (!checkedAt) return true;
  if (!Number.isInteger(thresholdDays) || thresholdDays < 1) {
    throw new TypeError("thresholdDays must be a positive integer");
  }
  return daysSinceCheck(checkedAt, asOf) > thresholdDays;
}
