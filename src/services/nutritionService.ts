import { GoogleGenAI, Type } from "@google/genai";
import { NutritionData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getNutritionForFood(foodName: string): Promise<NutritionData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Estimate the nutritional content for "${foodName}" per standard serving.`,
    config: {
      systemInstruction: "You are a nutrition expert. Provide estimated nutritional facts for the given food item. Be accurate as per typical nutritional databases.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          servingSize: { type: Type.STRING }
        },
        required: ["calories", "protein", "carbs", "fats"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to get nutrition data from AI");
  }

  return JSON.parse(text);
}
