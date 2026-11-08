import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SimulationFrame } from '../types';

interface TimePlotProps {
  data: SimulationFrame[];
}

const TimePlot: React.FC<TimePlotProps> = ({ data }) => {
  // We only show the last N frames to keep it readable, or all if short
  const visibleData = data.slice(-100); 

  return (
    <div className="w-full h-48 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
      <h4 className="text-sm font-semibold text-slate-400 mb-2">Interaction Timeline (Real-time)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={visibleData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMutual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="timestamp" 
            hide={true} 
            type="number" 
            domain={['dataMin', 'dataMax']} 
          />
          <YAxis hide={true} domain={[0, 1.2]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            labelStyle={{ display: 'none' }}
          />
          
          {/* Agent A - Blue */}
          <Area 
            type="step" 
            dataKey="agentAContact" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorA)" 
            stackId="2"
            isAnimationActive={false}
          />
          
          {/* Agent B - Red (offset slightly in chart logic or separate? Overlap is better) */}
           <Area 
            type="step" 
            dataKey="agentBContact" 
            stroke="#f43f5e" 
            fillOpacity={1} 
            fill="url(#colorB)" 
            stackId="3"
            isAnimationActive={false}
          />

          {/* Mutual - Green Overlay */}
          <Area 
            type="step" 
            dataKey="mutualContact" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorMutual)" 
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center space-x-6 text-xs text-slate-400 mt-2">
        <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>Person A Contact</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-rose-500 rounded mr-2"></div>Person B Contact</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>Mutual Connection</div>
      </div>
    </div>
  );
};

export default TimePlot;
