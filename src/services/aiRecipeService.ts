import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Recipe {
  name: string;
  description: string;
  prepTime: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  ingredients: string[];
  instructions: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const getAiRecipeSuggestions = async (
  calorieGoal: number,
  macroRatios: { protein: number; carbs: number; fats: number }
): Promise<Recipe[]> => {
  try {
    const prompt = `Suggest 3 healthy recipes that fit a daily goal of ${calorieGoal} calories, 
    with a macronutrient balance of ${macroRatios.protein}% Protein, ${macroRatios.carbs}% Carbs, and ${macroRatios.fats}% Fats. 
    Focus on balanced meals that are easy to prepare.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              prepTime: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              macros: {
                type: Type.OBJECT,
                properties: {
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER }
                },
                required: ["protein", "carbs", "fats"]
              },
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
            },
            required: ["name", "description", "prepTime", "calories", "macros", "ingredients", "instructions", "difficulty"]
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error generating AI recipes:", error);
    return [];
  }
};
