import logger from "../utils/logger.js";

/**
 * Safely extracts valid JSON from Gemini output.
 */
function safeExtractJson(text) {
  try {
    let clean = text
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .replace(/^\s*Here.*?:/gi, "")
      .trim();

    try {
      return JSON.parse(clean);
    } catch (error) {
      logger.error("Something went wrong while parsing JSON", error);
    }

    const start =
      clean.indexOf("[") !== -1
        ? clean.indexOf("[")
        : clean.indexOf("{");
    const end =
      clean.lastIndexOf("]") !== -1
        ? clean.lastIndexOf("]")
        : clean.lastIndexOf("}");

    if (start === -1 || end === -1) return null;
    const jsonString = clean.slice(start, end + 1);

    return JSON.parse(jsonString);
  } catch (err) {
    logger.warn("Failed to safely parse JSON", {
      message: err.message,
      rawText: text.slice(0, 500),
    });
    return null;
  }
}

/**
 * Generates 10 personalized Indian-style recipes using Gemini.
 */
export const geminiRecipe = async (userDetails) => {
  try {
    if (!userDetails) {
      logger.warn("Missing required user details", { userDetails });
      return {
        success: false,
        error: "Missing required data: userDetails",
      };
    }

    const prompt = `
You are "FoodLens AI", an expert Indian nutrition and recipe assistant.

Your task:
Generate exactly **6 Indian-style food recipes** personalized for this user:
${JSON.stringify(userDetails, null, 2)}

### STRICT OUTPUT RULES:
- Respond **only** with valid JSON following the schema below.
- Do NOT include markdown, comments, explanations, or any non-JSON text.
- Output must be a single valid JSON array of 10 recipes.
- Ensure all numeric fields are realistic and non-negative.
- Do not include null, undefined, or placeholder values.
- If unsure, output an empty array [].

### STRICT SCHEMA:
[
  {
    "basicDetails": {
      "nameOfReceipe": "String",
      "descriptionOfReceipe": "String",
      "timeToMake": number,
      "noOfPersonServing": number,
      "noOfCaleories": number,
      "difficultyToMake": "Easy|Medium|Hard"
    },
    "ingredients": ["string"],
    "instructions": [
      {
        "stepName": "string",
        "stepDescription": "string",
        "timeUsedByStep": number
      }
    ],
    "nutrition": {
      "macronutrients": [
        {
          "nutrientName": "Protein",
          "presentPerServing": number,
          "unitOfNutrientPresent": "g"
        },
        {
          "nutrientName": "Carbohydrate",
          "presentPerServing": number,
          "unitOfNutrientPresent": "g"
        },
        {
          "nutrientName": "Fiber",
          "presentPerServing": number,
          "unitOfNutrientPresent": "g"
        },
        {
          "nutrientName": "Sugar",
          "presentPerServing": number,
          "unitOfNutrientPresent": "g"
        },
        {
          "nutrientName": "Sodium",
          "presentPerServing": number,
          "unitOfNutrientPresent": "mg"
        },
        {
          "nutrientName": "Fat",
          "presentPerServing": number,
          "unitOfNutrientPresent": "g"
        }
      ],
      "vitaminsAndMinerals": [
        { "name": "Vitamin A", "presentNumber": number },
        { "name": "Vitamin C", "presentNumber": number },
        { "name": "Vitamin K", "presentNumber": number },
        { "name": "Folate", "presentNumber": number },
        { "name": "Iron", "presentNumber": number },
        { "name": "Calcium", "presentNumber": number }
      ],
      "healthyBenifits": ["string"]
    },
    "tipsAndInfo": {
      "receipeVariation": ["string"],
      "storageAndServingTips": {
        "storageInstructions": "string",
        "servingSuggestions": "string"
      }
    }
  },
  {}, {}, {}, {}, {}
]

Now output only the valid JSON array for the 6 recipes, nothing else.
`;

    // 🛰️ Gemini API call
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            topP: 0.9,
            responseMimeType: "application/json", // request strict JSON format
          },
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

    // 🧩 Parse JSON
    const parsed = safeExtractJson(text);
    if (!parsed) {
      logger.warn("Failed to parse Gemini response into valid JSON", { text });
      return {
        success: false,
        message: "Failed to parse Gemini response into valid JSON",
      };
    }

    return {
      success: true,
      receipes: parsed,
      message: "Gemini recipe analysis generated successfully",
    };
  } catch (error) {
    logger.error("Unexpected error in geminiRecipe", {
      message: error.message,
      stack: error.stack,
      userDetails,
    });
    return {
      success: false,
      message: "Unexpected error while generating Gemini recipes",
    };
  }
};
