import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PricingAdvice {
  suggestedPrice: number;
  marginPercentage: number;
  reasoning: string;
  competitorAnalysis: string;
}

export const getPricingRecommendation = async (
  itemName: string,
  ingredients: string,
  calculatedHpp: number
): Promise<PricingAdvice> => {
  try {
    const prompt = `
      I am running a Nasi Goreng / Fried Rice stall in Indonesia.
      I want to add a new menu item: "${itemName}".
      My ingredients are: ${ingredients}.
      My calculated HPP (Cost of Goods Sold) is IDR ${calculatedHpp}.
      
      Please analyze this and provide a recommended selling price. 
      Target a healthy profit margin for a food stall (typically 40-60% or more depending on market).
      
      Provide the output in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: { type: Type.NUMBER, description: "Recommended selling price in IDR" },
            marginPercentage: { type: Type.NUMBER, description: "The profit margin percentage based on suggested price" },
            reasoning: { type: Type.STRING, description: "Short explanation of why this price is good" },
            competitorAnalysis: { type: Type.STRING, description: "Brief thought on how this compares to typical market prices" }
          },
          required: ["suggestedPrice", "marginPercentage", "reasoning", "competitorAnalysis"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PricingAdvice;
    }
    
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Error fetching pricing advice:", error);
    // Fallback if API fails
    return {
      suggestedPrice: calculatedHpp * 2, // Default 100% markup
      marginPercentage: 50,
      reasoning: "AI service unavailable. Defaulting to standard 50% margin.",
      competitorAnalysis: "N/A"
    };
  }
};