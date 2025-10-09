import cron from "node-cron";
import User from "../models/user.model.js";
import { refreshRecipes } from "../services/reciepe.service.js";
import logger from "../utils/logger.js";
import { Recipe } from "../models/receipe.model.js";

cron.schedule("0 0 * * *", async () => {
  logger.info(`Running daily recipe refresh...`, {
    timestamp: new Date().toISOString(),
  });

  try {
    const expiredRecipes = await Recipe.find({
      expiresAt: { $lte: new Date() },
    });

    if (!expiredRecipes.length) {
      logger.info("No expired recipes found at this time.");
      return;
    }

    const userIds = [
      ...new Set(expiredRecipes.map((r) => r.userId.toString())),
    ];

    const users = await User.find(
      { _id: { $in: userIds } },
      {
        password: 0,
        email: 0,
        name: 0,
        isEmailVerified: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      }
    );

    for (const user of users) {
      await refreshRecipes(user._id, user);
      logger.info(`Recipes refreshed for user: ${user._id}`);
    }
  } catch (error) {
    logger.error("Cron job failed", { error: error.message });
  }
});
