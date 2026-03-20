export interface SubtrackDetail {
  duration: string;
  frequency: string;
  rationale: string;
  focusMovements: string[];
  goals: string[];
}

export const SUBTRACK_DETAILS: Record<string, SubtrackDetail> = {

  /* ─── CrossFit ─────────────────────────────────────────────────────── */

  overhead_shoulder_strength: {
    duration: "4-week cycle",
    frequency: "2\u20133 sessions / week",
    rationale:
      "Shoulder weakness and instability is the #1 limiter for gymnastics (HSPU, ring work, muscle-ups) and overhead barbell work (snatch, jerk). This track builds the pressing and stabilizing strength that gymnastic volume alone cannot provide.",
    focusMovements: [
      "Strict press",
      "Push press",
      "Z-press",
      "DB overhead press",
      "Banded pull-aparts",
      "Face pull",
    ],
    goals: [
      "Build strict pressing strength through full range of motion",
      "Improve scapular stability for safer overhead positions",
      "Remove the shoulder as a limiter in gymnastics and barbell work",
      "Develop the stabiliser strength needed for muscle-ups and HSPU",
    ],
  },

  lower_body_strength: {
    duration: "4-week cycle",
    frequency: "2\u20133 sessions / week",
    rationale:
      "Most CrossFit athletes are quad-dominant with underdeveloped glutes and hamstrings. Fixing this improves the clean, thruster, wall ball, box jump, and all squat-based movements. This is the highest-leverage sub-track for the majority of CrossFit athletes.",
    focusMovements: [
      "Back squat",
      "Front squat",
      "Romanian deadlift",
      "Hip thrust",
      "Bulgarian split squat",
      "Good morning",
    ],
    goals: [
      "Increase posterior chain recruitment in squat patterns",
      "Eliminate the weak-glute compensation that causes knee cave",
      "Transfer directly to cleaner barbell cycling and heavier thrusters",
      "Improve force output for box jumps and explosive lower body work",
    ],
  },

  muscular_endurance: {
    duration: "4-week cycle",
    frequency: "2\u20133 sessions / week",
    rationale:
      "For athletes who move well but fade in longer metcons. Programs moderate-load, moderate-rep work with short rest \u2014 training the ability to move weight repeatedly without technical breakdown. Improves barbell cycling, touch-and-go efficiency, and aerobic power output.",
    focusMovements: [
      "Tempo back squats",
      "DB circuits",
      "Kettlebell complexes",
      "Barbell cycling sets",
      "Rowing intervals",
      "EMOM loading",
    ],
    goals: [
      "Sustain output across rounds without technical breakdown",
      "Build aerobic capacity at moderate intensities",
      "Improve barbell cycling efficiency and touch-and-go transitions",
      "Develop the engine to stay competitive in longer workouts",
    ],
  },

  /* ─── Hyrox ─────────────────────────────────────────────────────────── */

  sled_carry_strength: {
    duration: "5-week cycle",
    frequency: "2\u20133 sessions / week",
    rationale:
      "The sled push/pull and sandbag carry are where Hyrox races are lost. Athletes without hip drive and loaded-carry strength collapse in form under fatigue. This is the most race-specific strength gap to close \u2014 and the biggest time saver on the course.",
    focusMovements: [
      "Safety bar squat",
      "Bulgarian split squat",
      "Farmer carry",
      "Sled work",
      "Sandbag carry",
      "Hip hinge variations",
    ],
    goals: [
      "Develop the hip drive needed to push a loaded sled without slowing",
      "Build unilateral lower body strength for loaded carry stability",
      "Maintain upright torso mechanics under carry fatigue",
      "Directly improve your split times on sled and carry stations",
    ],
  },

  running_economy_strength: {
    duration: "5-week cycle",
    frequency: "2\u20133 sessions / week",
    rationale:
      "Most Hyrox athletes come from running backgrounds with underdeveloped single-leg strength and hip stability \u2014 the exact traits that deteriorate pace over 8km of running under load. This track improves running economy without adding run volume.",
    focusMovements: [
      "Single-leg Romanian deadlift",
      "Step-up",
      "Hip thrust",
      "Calf raises",
      "Ankle stability drills",
      "Single-leg press",
    ],
    goals: [
      "Improve single-leg stability and force transfer during running",
      "Reduce hip drop and energy leak that slows pace under fatigue",
      "Build calf and ankle resilience for 8km of repeated loading",
      "Improve running economy without increasing run training volume",
    ],
  },

  station_specific_strength: {
    duration: "5-week cycle",
    frequency: "2\u20133 sessions / week",
    rationale:
      "Hyrox punishes athletes who neglect upper body pushing strength. The SkiErg demands lat and core power; wall balls demand shoulder endurance under fatigue. This track targets chest, shoulder, and tricep pressing to build the station-specific strength most Hyrox athletes lack.",
    focusMovements: [
      "Bench press",
      "DB shoulder press",
      "Tricep dips",
      "Push press",
      "Lat pull-down",
      "Goblet squat for wall ball prep",
    ],
    goals: [
      "Build pressing strength and endurance for SkiErg and wall ball",
      "Improve upper body power output across later race stations",
      "Develop shoulder resilience to hold form when fatigued",
      "Create a pressing base that carries over to all pushing stations",
    ],
  },

  /* ─── ATHX ──────────────────────────────────────────────────────────── */

  explosive_power: {
    duration: "6-week cycle",
    frequency: "3\u20134 sessions / week",
    rationale:
      "ATHX demands explosive output across many modalities \u2014 more so than Hyrox. Athletes need to develop rate of force development without the full technical demands of Olympic lifting. This track bridges that gap with power-focused variations that carry over immediately to competition.",
    focusMovements: [
      "Power clean",
      "Hang power snatch",
      "Box jump",
      "Jump squat",
      "Trap bar deadlift",
      "Med ball slam",
    ],
    goals: [
      "Increase rate of force development for explosive sport movements",
      "Develop power without requiring full Olympic lifting technique",
      "Build fast-twitch capacity for repeated sprint and jump efforts",
      "Transfer directly to the explosive demands of ATHX competition",
    ],
  },

  posterior_chain_hinge: {
    duration: "6-week cycle",
    frequency: "3\u20134 sessions / week",
    rationale:
      "ATHX athletes often have CrossFit backgrounds with underdeveloped hinge patterns and absolute strength ceilings. Raising your strength ceiling directly translates to more powerful sprinting, jumping, and sled-based movements \u2014 and reduces how much each effort costs you.",
    focusMovements: [
      "Conventional deadlift",
      "Romanian deadlift",
      "Good morning",
      "Glute-ham raise",
      "Heavy barbell row",
      "Trap bar carry",
    ],
    goals: [
      "Raise the absolute strength ceiling for all competition movements",
      "Build a strong posterior chain base for sprinting and jumping",
      "Develop hinge patterns that CrossFit training typically neglects",
      "Make every work effort feel lighter relative to your maximum",
    ],
  },

  upper_body_power: {
    duration: "6-week cycle",
    frequency: "3\u20134 sessions / week",
    rationale:
      "ATHX punishes athletes who are strong in isolation but crumble under accumulated fatigue. This track trains the ability to sustain output in the back half of competition \u2014 maintaining strength, speed, and form when your legs and lungs are already compromised.",
    focusMovements: [
      "EMOM barbell complexes",
      "Moderate-load circuits",
      "Timed kettlebell sets",
      "Sled conditioning",
      "Assault bike intervals",
      "Loaded carries for time",
    ],
    goals: [
      "Sustain strength output across a full competition without fading",
      "Build fatigue resistance at sport-relevant intensities",
      "Improve work capacity so later events cost less energy",
      "Train the mental and physical ability to push through accumulated load",
    ],
  },

  pulling_strength: {
    duration: "4-week cycle",
    frequency: "2 sessions / week",
    rationale:
      "CrossFit athletes often over-rely on kipping and never build strict pulling strength. This track balances pressing volume with heavy vertical and horizontal pulls.",
    focusMovements: ["Weighted pull-up", "Pendlay row", "Single-arm row", "Face pull", "Lat pulldown"],
    goals: [
      "Build strict pulling strength independent of kipping technique",
      "Balance shoulder health against high pressing volume",
      "Improve rope climb and bar muscle-up strength foundations",
    ],
  },

  strength_endurance: {
    duration: "5-week cycle",
    frequency: "3–4 sessions / week",
    rationale:
      "Hyrox rewards athletes who can repeat station efforts without collapsing. This track trains strength endurance across full race distance.",
    focusMovements: ["Tempo squats", "Carry intervals", "Row erg strength", "Wall ball volume", "SkiErg pulls"],
    goals: [
      "Maintain force output across repeated race stations",
      "Delay metabolic collapse in the second half of the race",
      "Build durability for eight demanding efforts",
    ],
  },

  competition_prep: {
    duration: "6-week cycle",
    frequency: "3–4 sessions / week",
    rationale:
      "A structured peaking phase for ATHX athletes with a competition date. Assumes a prior strength block — higher intensity, tighter volume, sport-specific emphasis.",
    focusMovements: ["Heavy singles and doubles", "Contrast sets", "Sport-specific complexes", "Explosive primers"],
    goals: [
      "Peak strength and power without accumulating fatigue",
      "Sharpen competition patterns under moderate load",
      "Arrive at race day fresh and confident",
    ],
  },
};

export function getSubtrackDetail(id: string): SubtrackDetail | null {
  return SUBTRACK_DETAILS[id] ?? null;
}
