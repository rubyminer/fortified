/** Derive copy from subtrack_config counts only — do not hardcode these patterns elsewhere. */
export function formatSessionsPerWeekLabel(
  baseDaysPerWeek: number,
  flexDaysPerWeek: number,
): string {
  if (flexDaysPerWeek <= 0) return `${baseDaysPerWeek}x per week`;
  return `${baseDaysPerWeek}–${baseDaysPerWeek + flexDaysPerWeek}x per week`;
}

export function formatCycleHeaderLabel(
  baseDaysPerWeek: number,
  flexDaysPerWeek: number,
  totalWeeks: number,
): string {
  return `${formatSessionsPerWeekLabel(baseDaysPerWeek, flexDaysPerWeek)} · ${totalWeeks} weeks`;
}
