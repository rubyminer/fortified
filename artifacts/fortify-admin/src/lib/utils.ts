import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function relativeTime(date: string) {
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
  catch { return date; }
}

export function shortDate(date: string) {
  try { return format(new Date(date), 'MMM d, yyyy'); }
  catch { return date; }
}

export const SPORT_SUBTRACKS: Record<string, { id: string; name: string }[]> = {
  crossfit: [
    { id: 'overhead_shoulder_strength', name: 'Overhead & Shoulder' },
    { id: 'lower_body_strength', name: 'Lower Body Strength' },
    { id: 'engine_builder', name: 'Engine Builder' },
  ],
  hyrox: [
    { id: 'sled_carry_strength', name: 'Sled & Carry Strength' },
    { id: 'running_economy', name: 'Running Economy' },
    { id: 'upper_body_push', name: 'Upper Body Push' },
  ],
  athx: [
    { id: 'explosive_power', name: 'Explosive Power' },
    { id: 'maximal_strength', name: 'Maximal Strength' },
    { id: 'conditioning', name: 'Conditioning' },
  ],
};

export const CATEGORIES = [
  'squat', 'hinge', 'press_vertical', 'press_horizontal',
  'pull_vertical', 'pull_horizontal', 'carry', 'olympic',
  'explosive', 'core', 'accessory'
];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export function subtrackLabel(s: string) {
  for (const [, subs] of Object.entries(SPORT_SUBTRACKS)) {
    const found = subs.find(x => x.id === s);
    if (found) return found.name;
  }
  return s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export function extractYoutubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
