
import { GoogleGenAI, Type } from "@google/genai";
import type { AIAnalysis } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise, neutral-tone market analysis summary for the cryptocurrency. Focus on recent news, market sentiment, and potential technical indicators.",
    },
    keyPoints: {
      type: Type.ARRAY,
      description: "An array of 3-4 key bullet points from the analysis.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["summary", "keyPoints"],
};

export const getAIAnalysis = async (coinName: string, coinSymbol: string): Promise<AIAnalysis | null> => {
  if (!API_KEY) {
    return Promise.resolve({
      summary: "AI analysis is currently unavailable. Please configure the Gemini API key to enable this feature.",
      keyPoints: ["API key not found.", "This is a placeholder message."]
    });
  }
  
  try {
    const prompt = `Provide a concise, neutral-tone market analysis for the cryptocurrency ${coinName} (${coinSymbol.toUpperCase()}). Focus on recent news, market sentiment, and potential technical indicators from the last 7 days. Do not give any financial advice.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    // Basic validation
    if(parsed.summary && Array.isArray(parsed.keyPoints)) {
        return parsed as AIAnalysis;
    }
    
    throw new Error("Invalid JSON structure received from AI.");

  } catch (error) {
    console.error("Error fetching AI analysis:", error);
    return null;
  }
};
