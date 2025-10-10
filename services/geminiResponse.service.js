import logger from "../utils/logger.js";

function extractJson(text) {
  try {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      return JSON.parse(text.slice(first, last + 1));
    }
  } catch (err) {
    logger.warn("Failed to parse JSON from Gemini response", {
      message: err.message,
      stack: err.stack,
    });
  }
  return null;
}

export const geminiResponse = async (productDetail, userDetail) => {
  try {
    if (!productDetail || !userDetail) {
      logger.warn("Missing required data for Gemini analysis", {
        productDetail,
        userDetail,
      });
      return {
        success: false,
        error: "Missing required data: productDetail or userDetail",
      };
    }

    const prompt = `
      You are a professional Nutrition & Health Assistant AI.

Your task: Analyze the provided product for the given user profile and output a **personalized, holistic health evaluation** in JSON.

✅ STRICT RULES:

1. Respond with **VALID JSON only**, strictly following the schema below. Do not include explanations, markdown, or extra text.
2. **Overall Rating ('overallRating') logic**:
   - **Allergies**: If any ingredient matches a user allergy → "Avoid" (value = 20).
   - **Medical conditions**: 
       - Diabetes + high sugar (>15g/serving) → "Avoid"
       - Hypertension + high sodium (>300mg/serving) → "Avoid"
       - Kidney or liver issues + high protein/fat/sodium → "Avoid"
   - **Health goals**:
       - Weight loss + high calories → "Moderate" (value = 60) or "Avoid"
       - Weight gain + very low calories/protein → "Moderate" (value = 60)
   - **Otherwise** → "Safe" (value = 90)
3. **Allergen Alerts**: Only include allergens matching the user profile. If none → ["No allergy detected based on user profile"]
4. **Key Nutrient Evaluation**: Consider:
   - User’s age, weight, height, activity level
   - Health goals (weight loss/gain/maintain)
   - Medical conditions (e.g., diabetes, hypertension)
   - Mark "dailyTargetEvaluation" as:
       - "isGood" if nutrient is suitable for this user
       - "isBad" if nutrient exceeds limits for this user
   - Nutrient thresholds (example):
       - Sugar > 15g → isBad
       - Fat > 15g → isBad
       - Sodium > 300mg → isBad
       - Calories: evaluate against weight goal
       - Protein: evaluate against activity level and goal
5. **Health Impact Summary**: Must include:
   - Allergies
   - Nutrient balance for user goals
   - Conflicting medical conditions
   - Lifestyle factors (sleep, stress, water intake)
6. **Recommendations**:
   - Healthy alternatives based on dietType and foodPreferences
   - Portion advice (serving size, timing, frequency)
   - General nutritional advice based on goals, activity, medical info
7. Always mention "No allergy detected" explicitly if no allergens match.

📘 **JSON Schema**:

{
  "basicInfo": {
      "productName": "string",
      "ingredientsList": ["string"],
      "servingSize": "string"
  },
  "personalizedHealthAnalysis": {
      "overallRating": {"value": number, "overAll": 100, "type": "Avoid | Moderate | Safe"},
      "keyNutrientsEvaluation": {
          "calories": {"value": number|null, "unit":"kcal", "dailyTargetEvaluation":"isGood|isBad"},
          "sugar": {"value": number|null, "unit":"g", "dailyTargetEvaluation":"isGood|isBad"},
          "protein": {"value": number|null, "unit":"g", "dailyTargetEvaluation":"isGood|isBad"},
          "fat": {"value": number|null, "unit":"g", "dailyTargetEvaluation":"isGood|isBad"},
          "sodium": {"value": number|null, "unit":"mg", "dailyTargetEvaluation":"isGood|isBad"},
          "carbohydrates": {"value": number|null, "unit":"g", "dailyTargetEvaluation":"isGood|isBad"},
          "fiber": {"value": number|null, "unit":"g", "dailyTargetEvaluation":"isGood|isBad"}
      },
      "allergenAlerts": ["string"],
      "healthImpactSummary": ["string"]
  },
  "recommendations": {
      "healthyAlternatives": ["string"],
      "portionAdvice": [
          {"recommendedServing": "string", "timingSuggestion": "string", "frequency": "string"}
      ],
      "generalNutritionalAdvice": ["string"]
  }
}


Analyze these inputs holistically:
User Profile: ${JSON.stringify(userDetail)}
Product: ${JSON.stringify(productDetail)}

Return **only valid JSON** strictly following the schema.
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      logger.error("Gemini API returned an error", {
        status: response.status,
        statusText: response.statusText,
        body: errText,
      });
      return {
        success: false,
        message: `Gemini API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      logger.warn("Gemini API returned empty response", { data });
      return {
        success: false,
        message: "Gemini API returned empty response",
      };
    }

    let parsed = extractJson(text);

    if (!parsed) {
      logger.warn("Failed to parse Gemini response into valid JSON", { text });
      return {
        success: false,
        message: "Failed to parse Gemini response into valid JSON",
      };
    }

    logger.info("Gemini analysis generated successfully", {
      productName: productDetail?.name,
      userId: userDetail?.id,
    });

    return {
      success: true,
      analysis: parsed,
      message: "Gemini analysis generated successfully",
    };
  } catch (error) {
    logger.error("Unexpected error in geminiResponse", {
      message: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      message: "Unexpected error while generating Gemini analysis",
    };
  }
};
