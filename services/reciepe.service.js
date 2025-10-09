import { Recipe } from "../models/receipe.model.js";
import { geminiRecipe } from "./geminiRecipe.service.js";

function getNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 5,
    0,
    0,
    0,
    0
  );
  return nextMidnight;
}

export async function refreshRecipes(userId, userProfile) {
  const response = await geminiRecipe(userProfile);

  const recipes = response.receipes;

  if (recipes.length < 0) throw new Error("No recipes received from AI");

  return Recipe.create({
    userId,
    profileVersion: userProfile.profileUpdateCount,
    recipes,
    expiresAt: getNextMidnight(),
  });
}

export async function getLatestRecipes(userId, userProfile) {
  let recipeDoc = await Recipe.findOne({ userId }).sort({ createdAt: -1 });

  const shouldRefresh =
    !recipeDoc ||
    new Date() >= recipeDoc.expiresAt ||
    recipeDoc.profileVersion !== userProfile.profileUpdateCount;

  if (shouldRefresh) {
    await Recipe.deleteMany({ userId });
    recipeDoc = await refreshRecipes(userId, userProfile);
  }

  return recipeDoc;
}
