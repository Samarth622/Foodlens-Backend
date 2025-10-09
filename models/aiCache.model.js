import mongoose from "mongoose";

const aiCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    profileVersion: {
      type: Number,
      required: false,
    },
    aiResponse: {
      type: Object,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "30d",
    },
  },
  {
    timestamps: true,
  }
);

aiCacheSchema.index({ userId: 1, productId: 1, profileVersion: 1 }, { unique: true });

export default mongoose.model("AiCache", aiCacheSchema);
