import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  profileVersion: { type: Number, required: true },
  recipes: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

recipeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Recipe = mongoose.model("Recipe", recipeSchema);
