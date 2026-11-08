import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Play, Square, Info, Activity, RefreshCw } from 'lucide-react';
import { PersonalityMode, AgentState, SimulationFrame } from './types';
import { BEHAVIORS } from './constants';
import { createAgent, getNextGaze } from './services/simulationUtils';
import { generateAnalysis } from './services/geminiService';
import Face from './components/Face';
import TimePlot from './components/TimePlot';

const App: React.FC = () => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [modeA, setModeA] = useState<PersonalityMode>(PersonalityMode.WESTERN_NORMAL);
  const [modeB, setModeB] = useState<PersonalityMode>(PersonalityMode.SOCIAL_ANXIETY);
  
  const [agentA, setAgentA] = useState<AgentState>(createAgent(PersonalityMode.WESTERN_NORMAL));
  const [agentB, setAgentB] = useState<AgentState>(createAgent(PersonalityMode.SOCIAL_ANXIETY));
  
  const [history, setHistory] = useState<SimulationFrame[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Reset simulation when modes change
  const resetSimulation = useCallback(() => {
    setAgentA(createAgent(modeA));
    setAgentB(createAgent(modeB));
    setHistory([]);
    setAnalysis(null);
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, [modeA, modeB]);

  // Main Simulation Loop
  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const deltaTime = 50; // Fixed timestep for stability logic-wise, though RAF varies

    setAgentA(prevA => {
      setAgentB(prevB => {
        // Calculate new states
        // Agent A reacts to Agent B's *previous* position (or current, negligible diff at 50ms)
        const nextAState = getNextGaze(prevA, deltaTime, prevB.currentGaze);
        const nextBState = getNextGaze(prevB, deltaTime, prevA.currentGaze);

        // Update full objects
        const newA = { ...prevA, ...nextAState };
        const newB = { ...prevB, ...nextBState };

        // Record History
        const isMutual = newA.isMakingContact && newB.isMakingContact;
        
        // We only append history every few frames to save React renders/memory if needed, 
        // but for < 1 min simulation 60fps is fine. Let's throttle chart updates slightly visually, but keep data logic.
        
        return newB; // Just returning to satisfy setter, actual update happens in batch below or via effects? 
        // React state setters inside RAF is tricky. 
        // Better pattern: Calculate everything, then set.
      });
      return prevA;
    });

    // Actually, let's do the calculation cleanly outside the setters
    setAgentA(currentA => {
      // Need B's state. We can't easily access currentB inside setAgentA without refs or nesting.
      // Using refs for simulation state is better for performance, then syncing to React state for render.
      return currentA; 
    });
    
    // ... Switching to Ref-based simulation loop for stability ...
    requestRef.current = requestAnimationFrame(animate);
  }, []);


  // --- Refactored Simulation Loop using Refs for Mutable State ---
  const stateRef = useRef({
    a: createAgent(modeA),
    b: createAgent(modeB),
    lastTick: 0,
    history: [] as SimulationFrame[]
  });

  useEffect(() => {
    stateRef.current.a = createAgent(modeA);
    stateRef.current.b = createAgent(modeB);
    stateRef.current.history = [];
  }, [modeA, modeB]);

  const tick = (time: number) => {
    if (!stateRef.current.lastTick) stateRef.current.lastTick = time;
    const delta = time - stateRef.current.lastTick;
    
    // Cap delta to avoid huge jumps if tab inactive
    const safeDelta = Math.min(delta, 100);

    if (safeDelta > 30) { // ~30fps update logic
       const { a, b } = stateRef.current;
       
       const nextAUpdates = getNextGaze(a, safeDelta, b.currentGaze);
       const nextBUpdates = getNextGaze(b, safeDelta, a.currentGaze);

       const newA = { ...a, ...nextAUpdates } as AgentState;
       const newB = { ...b, ...nextBUpdates } as AgentState;

       stateRef.current.a = newA;
       stateRef.current.b = newB;
       stateRef.current.lastTick = time;

       const frame: SimulationFrame = {
         timestamp: time,
         agentAContact: newA.isMakingContact ? 1 : 0,
         agentBContact: newB.isMakingContact ? 1 : 0,
         mutualContact: (newA.isMakingContact && newB.isMakingContact) ? 1 : 0,
         agentAAttention: 100,
         agentBAttention: 100
       };
       stateRef.current.history.push(frame);

       // Sync to React State for render
       setAgentA(newA);
       setAgentB(newB);
       
       // Throttle history state updates to avoid UI lag
       if (stateRef.current.history.length % 5 === 0) {
          setHistory([...stateRef.current.history]); 
       }
    }

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(tick);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await generateAnalysis(modeA, modeB, stateRef.current.history);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-rose-500/30">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-lg shadow-lg shadow-rose-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-200 to-orange-100">Oculus</h1>
              <p className="text-xs text-slate-500 font-mono tracking-wider">EYE CONTACT SIMULATOR</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Documentation</a>
             <div className="w-px h-4 bg-slate-700"></div>
             <span className="text-xs text-slate-500">v1.0.0</span>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Control Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-xl">
             <h2 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-6 flex items-center">
               <Activity className="w-4 h-4 mr-2" />
               Configuration
             </h2>

             {/* Person A Config */}
             <div className="mb-6">
               <label className="block text-xs font-semibold text-blue-400 mb-2">PERSON A (LEFT)</label>
               <select 
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                 value={modeA}
                 onChange={(e) => {
                    setModeA(e.target.value as PersonalityMode);
                    resetSimulation();
                 }}
               >
                 {Object.values(PersonalityMode).map(m => <option key={m} value={m}>{m}</option>)}
               </select>
               <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                 {BEHAVIORS[modeA].description}
               </p>
             </div>

             {/* Person B Config */}
             <div className="mb-8">
               <label className="block text-xs font-semibold text-rose-400 mb-2">PERSON B (RIGHT)</label>
               <select 
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                 value={modeB}
                 onChange={(e) => {
                    setModeB(e.target.value as PersonalityMode);
                    resetSimulation();
                 }}
               >
                 {Object.values(PersonalityMode).map(m => <option key={m} value={m}>{m}</option>)}
               </select>
               <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                 {BEHAVIORS[modeB].description}
               </p>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={() => setIsPlaying(!isPlaying)}
                 className={`col-span-1 flex items-center justify-center py-3 rounded-lg font-bold text-sm transition-all shadow-lg ${
                   isPlaying 
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/25'
                 }`}
               >
                 {isPlaying ? <Square className="w-4 h-4 mr-2 fill-current" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                 {isPlaying ? 'PAUSE' : 'START'}
               </button>
               
               <button
                 onClick={resetSimulation}
                 className="col-span-1 flex items-center justify-center py-3 bg-slate-800 text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-700 transition-all border border-slate-700"
               >
                 <RefreshCw className="w-4 h-4 mr-2" />
                 RESET
               </button>
             </div>
          </div>

          {/* Legend/Info */}
          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              HOW TO READ
            </h3>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 mr-2 shrink-0"></span>
                <span><strong>Person A's Eyes:</strong> Show where A is looking. If centered, A is looking at B.</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 mr-2 shrink-0"></span>
                <span><strong>Person B's Eyes:</strong> Show where B is looking. If centered, B is looking at A.</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 mr-2 shrink-0"></span>
                <span><strong>Green Indicator:</strong> Mutual eye contact established.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Center Visualization */}
        <div className="lg:col-span-9 flex flex-col space-y-6">
          
          {/* Simulation Stage */}
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
            
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 to-transparent pointer-events-none"></div>

            {/* Connection Line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-slate-800 z-0">
               {/* Animated Pulse when mutual contact */}
               {agentA.isMakingContact && agentB.isMakingContact && (
                 <div className="w-full h-full bg-emerald-500 blur-sm animate-pulse"></div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-12 w-full max-w-4xl z-10 relative">
               {/* Agent A View */}
               <div className="flex flex-col items-center">
                  <div className={`p-1 rounded-[3.2rem] transition-all duration-300 ${agentA.isMakingContact ? 'bg-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'bg-transparent'}`}>
                    <Face agent={agentA} label="Person A" />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-xs font-mono text-slate-500 mb-1">STATE</div>
                    <div className="text-sm font-bold text-blue-400">
                      {agentA.isMakingContact ? 'CONTACT' : 'AVERTED'}
                    </div>
                  </div>
               </div>

               {/* Agent B View */}
               <div className="flex flex-col items-center">
                  <div className={`p-1 rounded-[3.2rem] transition-all duration-300 ${agentB.isMakingContact ? 'bg-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.3)]' : 'bg-transparent'}`}>
                    <Face agent={agentB} label="Person B" />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-xs font-mono text-slate-500 mb-1">STATE</div>
                    <div className="text-sm font-bold text-rose-400">
                      {agentB.isMakingContact ? 'CONTACT' : 'AVERTED'}
                    </div>
                  </div>
               </div>
            </div>

            {/* Status Overlay */}
            {agentA.isMakingContact && agentB.isMakingContact && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500/10 border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-bold tracking-widest animate-pulse">
                MUTUAL CONTACT
              </div>
            )}
          </div>

          {/* Time Plot */}
          <TimePlot data={history} />

          {/* Analysis Section */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-lg font-bold text-slate-200">AI Analysis</h3>
                 <button 
                  onClick={handleAnalysis}
                  disabled={history.length < 50 || isAnalyzing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-colors"
                 >
                   {isAnalyzing ? 'GENERATING...' : 'ANALYZE SESSION'}
                 </button>
              </div>
              
              {analysis ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="leading-relaxed text-slate-300">{analysis}</p>
                </div>
              ) : (
                <div className="text-slate-500 text-sm italic">
                  Run the simulation for a few seconds to generate interaction data, then click Analyze.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
