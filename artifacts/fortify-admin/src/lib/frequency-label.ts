export function formatSessionsPerWeekLabel(baseDaysPerWeek: number, flexDaysPerWeek: number): string {
  if (flexDaysPerWeek <= 0) return `${baseDaysPerWeek}x per week`;
  return `${baseDaysPerWeek}–${baseDaysPerWeek + flexDaysPerWeek}x per week`;
}
