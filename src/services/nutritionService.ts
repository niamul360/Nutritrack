import { NutritionData } from "../types";

export async function getNutritionForFood(foodName: string): Promise<NutritionData> {
  const response = await fetch("/api/nutrition", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ foodName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get nutrition data");
  }

  return response.json();
}
