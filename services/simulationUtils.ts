import { AgentState, GazeTarget, PersonalityMode } from '../types';
import { BEHAVIORS } from '../constants';

export const INITIAL_GAZE: GazeTarget = { x: 0, y: 0 };

export const createAgent = (mode: PersonalityMode): AgentState => ({
  currentGaze: { ...INITIAL_GAZE },
  targetGaze: { ...INITIAL_GAZE },
  blink: false,
  mode,
  isMakingContact: true,
  attentionLevel: 100,
  timeSinceLastShift: 0,
});

export const getNextGaze = (
  agent: AgentState,
  deltaTime: number,
  partnerGaze: GazeTarget
): Partial<AgentState> => {
  const behavior = BEHAVIORS[agent.mode];
  let { targetGaze, timeSinceLastShift, currentGaze } = agent;
  
  // Update timer
  timeSinceLastShift += deltaTime;

  // Determine State State (Fixated vs Averted)
  // Distance from center (0,0) determines if we are currently "looking at eyes" target-wise
  const distFromCenter = Math.sqrt(targetGaze.x ** 2 + targetGaze.y ** 2);
  const isFixatedTarget = distFromCenter < 0.2;

  let shouldSwitch = false;
  
  // Add some randomness to duration logic based on state
  if (isFixatedTarget) {
    // Currently aiming at eyes, should we break?
    shouldSwitch = timeSinceLastShift > behavior.fixationDurationMean * (0.5 + Math.random());
  } else {
    // Currently averted, should we look back?
    shouldSwitch = timeSinceLastShift > behavior.aversionDurationMean * (0.5 + Math.random());
  }

  if (shouldSwitch) {
    timeSinceLastShift = 0;
    const roll = Math.random();
    
    if (roll < behavior.fixationChance) {
      // Look at eyes
      targetGaze = { 
        x: (Math.random() - 0.5) * 0.15, 
        y: (Math.random() - 0.5) * 0.15 
      }; 
    } else {
      // Look away
      const zones = behavior.preferredAversionZones;
      const zone = zones[Math.floor(Math.random() * zones.length)];
      // Add variance to zone
      targetGaze = {
        x: zone.x + (Math.random() - 0.5) * 0.2,
        y: zone.y + (Math.random() - 0.5) * 0.2
      };
    }
  }

  // Jitter
  const jitterX = (Math.random() - 0.5) * behavior.jitter;
  const jitterY = (Math.random() - 0.5) * behavior.jitter;

  // Interpolate Current Gaze towards Target
  // Lerp factor
  const t = behavior.saccadeSpeed; 
  const nextX = currentGaze.x + (targetGaze.x + jitterX - currentGaze.x) * t;
  const nextY = currentGaze.y + (targetGaze.y + jitterY - currentGaze.y) * t;

  // Blink logic
  // Humans blink ~15-20 times/min -> once every 3-4s.
  // 50ms ticks = 20 ticks/s.
  // P(blink) per tick = 1 / (3.5 * 20) = 1/70 ~= 0.015
  const blink = Math.random() < 0.015; 

  // Check if making contact (actual current gaze is near center)
  // 0.25 threshold matches the eye region. Looking at mouth (y=0.5) will result in isMakingContact=false.
  const currentDist = Math.sqrt(nextX ** 2 + nextY ** 2);
  const isMakingContact = currentDist < 0.25;

  return {
    currentGaze: { x: nextX, y: nextY },
    targetGaze,
    timeSinceLastShift,
    blink: blink || (agent.blink && Math.random() > 0.8), // Sustain blink for ~250ms
    isMakingContact,
  };
};