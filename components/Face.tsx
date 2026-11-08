import React from 'react';
import { AgentState } from '../types';

interface FaceProps {
  agent: AgentState;
  label: string;
  isSelf?: boolean; // If true, this represents "You" (so you don't see your own eyes, but for the simulator we show both third-person)
}

// Coordinate mapping:
// Input X: -1 (Left) to 1 (Right)
// SVG Eye movement range: -15px to 15px
const MAX_EYE_OFFSET = 12; 

const Face: React.FC<FaceProps> = ({ agent, label }) => {
  const { currentGaze, blink, isMakingContact } = agent;

  // Convert normalized gaze to pixel offsets
  const pupilX = currentGaze.x * MAX_EYE_OFFSET;
  const pupilY = currentGaze.y * MAX_EYE_OFFSET; // Y is inverted in SVG? No, + is down usually.

  // Eyelid height (for blinking)
  const eyelidHeight = blink ? 20 : 0;

  // Dynamic colors based on contact
  const irisColor = isMakingContact ? '#3b82f6' : '#64748b'; // Blue if making contact, slate otherwise
  const pupilColor = '#0f172a';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-48 h-60 bg-orange-100 rounded-[3rem] shadow-xl flex flex-col items-center border-4 border-slate-800 overflow-hidden">
        {/* Hair / Head top */}
        <div className="absolute top-0 w-full h-16 bg-slate-800 rounded-b-xl z-10"></div>
        
        {/* Eyes Container */}
        <div className="absolute top-24 w-full flex justify-center space-x-4 px-4">
          {/* Left Eye */}
          <div className="relative w-12 h-8 bg-white rounded-full overflow-hidden border-2 border-slate-300 shadow-inner">
             {/* Pupil/Iris Group */}
             <div 
                className="absolute w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                  backgroundColor: irisColor,
                  transform: `translate(${pupilX + 10}px, ${pupilY + 4}px)`, // Offset to center + gaze
                }}
             >
                <div className="w-2 h-2 bg-black rounded-full"></div>
             </div>
             {/* Eyelid */}
             <div 
                className="absolute top-0 left-0 w-full bg-orange-200 transition-all duration-75 z-20"
                style={{ height: `${eyelidHeight}px` }}
             ></div>
          </div>

          {/* Right Eye */}
          <div className="relative w-12 h-8 bg-white rounded-full overflow-hidden border-2 border-slate-300 shadow-inner">
             <div 
                className="absolute w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                  backgroundColor: irisColor,
                  transform: `translate(${pupilX + 10}px, ${pupilY + 4}px)`,
                }}
             >
                <div className="w-2 h-2 bg-black rounded-full"></div>
             </div>
             {/* Eyelid */}
             <div 
                className="absolute top-0 left-0 w-full bg-orange-200 transition-all duration-75 z-20"
                style={{ height: `${eyelidHeight}px` }}
             ></div>
          </div>
        </div>

        {/* Nose */}
        <div className="absolute top-36 w-4 h-8 bg-orange-200/50 rounded-full border border-orange-200"></div>

        {/* Mouth */}
        <div className="absolute bottom-10 w-12 h-1 bg-slate-400 rounded-full opacity-60"></div>
        
      </div>
      <div className="mt-4 flex flex-col items-center">
        <h3 className="text-lg font-bold text-white">{label}</h3>
        <span className={`text-xs px-2 py-1 rounded-full mt-1 ${isMakingContact ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
          {isMakingContact ? 'Eye Contact' : 'Looking Away'}
        </span>
      </div>
    </div>
  );
};

export default Face;
