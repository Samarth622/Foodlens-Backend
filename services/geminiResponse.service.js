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
      You are a nutrition and health assistant. 
      Analyze the product for the given user profile. 
      Respond with **only valid JSON**, no extra text. 

      Schema to follow:

      {
          "basicInfo": {
              "productName": "string",
              "ingredientsList": ["string"],
              "servingSize": "string"
          },
          "personalizedHealthAnalysis": {
              "overallRating": {value: number, overAll: 100, type: "Avoid | Moderate | Safe"},
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
              "portionAdvice": ["recommendedServing": "string", "timingSuggestion": "string", "frequency": "string"],
              "generalNutritionalAdvice": ["string"]
          }
      }

      User Profile: ${JSON.stringify(userDetail)}
      Product: ${JSON.stringify(productDetail)}
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
