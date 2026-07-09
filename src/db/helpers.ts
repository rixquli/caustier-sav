export function toIsoString(value: Date | string | null | undefined): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function toIsoStringOrNull(
  value: Date | string | null | undefined,
): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function toBoolFlag(value: boolean | number | null | undefined): 0 | 1 {
  return value ? 1 : 0;
}

export function parseOptionalInt(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
