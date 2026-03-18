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

export const ALL_SUBTRACKS: DisciplineGroup[] = [
  {
    discipline: 'crossfit',
    label: 'CrossFit',
    subtracks: [
      { id: 'overhead_shoulder_strength', name: 'Overhead & Shoulder', desc: 'Press strength and stability' },
      { id: 'lower_body_strength', name: 'Lower Body Strength', desc: 'Squat and hinge patterns' },
      { id: 'engine_builder', name: 'Engine Builder', desc: 'Aerobic capacity and pacing' },
    ]
  },
  {
    discipline: 'hyrox',
    label: 'Hyrox',
    subtracks: [
      { id: 'sled_carry_strength', name: 'Sled & Carry Strength', desc: 'Push/pull force production' },
      { id: 'running_economy', name: 'Running Economy', desc: 'Efficiency and stride mechanics' },
      { id: 'upper_body_push', name: 'Upper Body Push', desc: 'Chest and shoulder endurance' },
    ]
  },
  {
    discipline: 'athx',
    label: 'ATHX',
    subtracks: [
      { id: 'explosive_power', name: 'Explosive Power', desc: 'Speed-strength and plyometrics' },
      { id: 'maximal_strength', name: 'Maximal Strength', desc: 'Peak force development' },
      { id: 'conditioning', name: 'Conditioning', desc: 'Work capacity and recovery' },
    ]
  }
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
