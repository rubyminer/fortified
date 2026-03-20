const ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/** Pick `count` days not in `primary`, spaced across the week. */
export function suggestSupplementalDays(primary: string[], count: number): string[] {
  const p = new Set(primary.map(d => d.toLowerCase()));
  const avail = ORDER.filter(d => !p.has(d));
  if (count <= 0) return [];
  if (avail.length <= count) return [...avail];
  const step = avail.length / count;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.min(avail.length - 1, Math.floor(i * step + step / 2));
    out.push(avail[idx]!);
  }
  return [...new Set(out)];
}
