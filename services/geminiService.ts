import { GoogleGenAI } from "@google/genai";
import { PersonalityMode, SimulationFrame } from "../types";

const processStats = (frames: SimulationFrame[]) => {
  const totalFrames = frames.length;
  if (totalFrames === 0) return null;

  const mutualFrames = frames.filter(f => f.mutualContact === 1).length;
  const agentAFrames = frames.filter(f => f.agentAContact === 1).length;
  const agentBFrames = frames.filter(f => f.agentBContact === 1).length;

  return {
    durationSeconds: (totalFrames * 50) / 1000, // Assuming 50ms tick
    agentAPercentage: Math.round((agentAFrames / totalFrames) * 100),
    agentBPercentage: Math.round((agentBFrames / totalFrames) * 100),
    mutualPercentage: Math.round((mutualFrames / totalFrames) * 100),
  };
};

export const generateAnalysis = async (
  modeA: PersonalityMode,
  modeB: PersonalityMode,
  frames: SimulationFrame[]
) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const stats = processStats(frames);
  if (!stats) return "No data to analyze.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are an expert social psychologist analyzing an eye contact simulation.
    
    The simulation involved two agents:
    Agent A (Left): ${modeA}
    Agent B (Right): ${modeB}
    
    Statistics:
    - Total Interaction Time: ${stats.durationSeconds} seconds
    - Agent A Eye Contact Frequency: ${stats.agentAPercentage}%
    - Agent B Eye Contact Frequency: ${stats.agentBPercentage}%
    - Mutual Eye Contact (Overlap): ${stats.mutualPercentage}%

    Please provide a concise analysis (max 150 words) of this interaction. 
    1. How would Agent A feel? 
    2. How would Agent B feel?
    3. Is there a cultural mismatch or social friction?
    
    Return the response in plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate analysis due to an API error.";
  }
};
