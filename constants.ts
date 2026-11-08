import { PersonalityMode } from './types';

// X/Y coordinates: 0,0 is center of eyes. 
// Range is approx -1 to 1. 
// > 0.25 usually breaks eye contact.

interface BehaviorProfile {
  name: string;
  description: string;
  fixationChance: number; // Chance to look at eyes
  fixationDurationMean: number; // ms
  aversionDurationMean: number; // ms
  saccadeSpeed: number; // 0-1 (1 is instant)
  jitter: number; // Random noise
  preferredAversionZones: { x: number; y: number }[]; // Where they look when not looking at eyes
}

export const BEHAVIORS: Record<PersonalityMode, BehaviorProfile> = {
  [PersonalityMode.WESTERN_NORMAL]: {
    name: 'Western Normal',
    description: 'Natural, balanced gaze (3-5s). Breaks contact to mouth/face to regulate tension. ~60% eye contact.',
    fixationChance: 0.65,
    fixationDurationMean: 4000,
    aversionDurationMean: 1500,
    saccadeSpeed: 0.12,
    jitter: 0.03,
    preferredAversionZones: [
      {x: 0, y: 0.5},    // Mouth
      {x: 0.3, y: 0.3},  // Cheek
      {x: -0.2, y: -0.4}, // Forehead/Think
      {x: 0.4, y: 0}     // Side
    ],
  },
  [PersonalityMode.EASTERN_NORMAL]: {
    name: 'Eastern Normal',
    description: 'Respectful, indirect gaze. Focuses on neck/chin to avoid aggression. Direct eye contact is briefer.',
    fixationChance: 0.35,
    fixationDurationMean: 1500,
    aversionDurationMean: 2500,
    saccadeSpeed: 0.1,
    jitter: 0.02,
    preferredAversionZones: [
      {x: 0, y: 0.5}, // Mouth
      {x: 0, y: 0.7}, // Chin
      {x: 0, y: 0.9}  // Neck
    ], 
  },
  [PersonalityMode.SOCIAL_ANXIETY]: {
    name: 'Social Anxiety',
    description: 'High avoidance. Difficulty maintaining gaze. Quick, darting movements away from face.',
    fixationChance: 0.15,
    fixationDurationMean: 400,
    aversionDurationMean: 2500,
    saccadeSpeed: 0.35, // Nervous energy
    jitter: 0.12,
    preferredAversionZones: [
      {x: 0.8, y: 0.8}, // Down-right
      {x: -0.8, y: 0.8}, // Down-left
      {x: 0, y: 1.0} // Down
    ], 
  },
  [PersonalityMode.NEURODIVERGENT_ASD]: {
    name: 'Neurodivergent (ASD)',
    description: 'Variable. May focus intensely on specific features (mouth, forehead) or avoid entirely.',
    fixationChance: 0.2, 
    fixationDurationMean: 5000,
    aversionDurationMean: 4000,
    saccadeSpeed: 0.2,
    jitter: 0.01,
    preferredAversionZones: [
      {x: 0, y: 0.6}, // Mouth
      {x: 0, y: -0.5}, // Forehead
      {x: 0.4, y: 0.4} // Cheek
    ], 
  },
  [PersonalityMode.INTENSE_STARE]: {
    name: 'Intense/Aggressive',
    description: 'Uncomfortably long eye contact (>8s). Minimal blinking or aversion.',
    fixationChance: 0.95,
    fixationDurationMean: 8000,
    aversionDurationMean: 300,
    saccadeSpeed: 0.08,
    jitter: 0.005,
    preferredAversionZones: [{x: 0.1, y: 0}],
  },
};