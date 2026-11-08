export enum PersonalityMode {
  WESTERN_NORMAL = 'Western Norms',
  EASTERN_NORMAL = 'Eastern Norms',
  SOCIAL_ANXIETY = 'Social Anxiety',
  NEURODIVERGENT_ASD = 'Neurodivergent (ASD)',
  INTENSE_STARE = 'Intimidating/Intense',
}

export interface GazeTarget {
  x: number; // -1 to 1 (Horizontal: Left <-> Right)
  y: number; // -1 to 1 (Vertical: Up <-> Down)
}

export interface AgentState {
  currentGaze: GazeTarget;
  targetGaze: GazeTarget;
  blink: boolean;
  mode: PersonalityMode;
  isMakingContact: boolean;
  attentionLevel: number; // 0-100
  timeSinceLastShift: number;
}

export interface SimulationFrame {
  timestamp: number;
  agentAContact: number; // 1 or 0
  agentBContact: number; // 1 or 0
  mutualContact: number; // 1 or 0
  agentAAttention: number;
  agentBAttention: number;
}

export interface SimulationConfig {
  speed: number;
  duration: number;
}
