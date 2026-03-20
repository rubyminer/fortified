export interface SubtrackInfo {
  id: string;
  name: string;
  desc: string;
}

export interface DisciplineGroup {
  discipline: string;
  label: string;
  subtracks: SubtrackInfo[];
}

/** Offline / empty-DB fallback — matches migrations 007 + subtrack_config. */
export const ALL_SUBTRACKS: DisciplineGroup[] = [
  {
    discipline: 'crossfit',
    label: 'CrossFit',
    subtracks: [
      { id: 'lower_body_strength', name: 'Lower Body Strength', desc: 'Squat and hinge patterns' },
      { id: 'overhead_shoulder_strength', name: 'Overhead & Shoulder Strength', desc: 'Press strength and stability' },
      { id: 'pulling_strength', name: 'Pulling Strength', desc: 'Strict pulling strength' },
      { id: 'muscular_endurance', name: 'Muscular Endurance', desc: 'Barbell cycling and endurance' },
    ],
  },
  {
    discipline: 'hyrox',
    label: 'Hyrox',
    subtracks: [
      { id: 'sled_carry_strength', name: 'Sled & Loaded Carry Strength', desc: 'Hip drive and carries' },
      { id: 'running_economy_strength', name: 'Running Economy Strength', desc: 'Single-leg and running strength' },
      { id: 'station_specific_strength', name: 'Station-Specific Strength', desc: 'Race station strength' },
      { id: 'strength_endurance', name: 'Strength Endurance', desc: 'Repeatable strength' },
    ],
  },
  {
    discipline: 'athx',
    label: 'ATHX',
    subtracks: [
      { id: 'explosive_power', name: 'Explosive Power', desc: 'Olympic variations and plyometrics' },
      { id: 'posterior_chain_hinge', name: 'Posterior Chain & Hinge', desc: 'Deadlift and hip extension' },
      { id: 'upper_body_power', name: 'Upper Body Power', desc: 'Upper push and pull power' },
      { id: 'competition_prep', name: 'Competition Prep', desc: 'Peaking for event day' },
    ],
  },
];

const SUBTRACK_TO_DISCIPLINE: Record<string, string> = {};
for (const group of ALL_SUBTRACKS) {
  for (const sub of group.subtracks) {
    SUBTRACK_TO_DISCIPLINE[sub.id] = group.discipline;
  }
}

export function disciplineFromSubtrack(subtrack: string): string {
  return SUBTRACK_TO_DISCIPLINE[subtrack] ?? 'crossfit';
}

export function subtrackLabel(subtrack: string): string {
  for (const group of ALL_SUBTRACKS) {
    const found = group.subtracks.find(s => s.id === subtrack);
    if (found) return found.name;
  }
  return subtrack.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
