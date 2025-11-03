import asyncHandler from "../middlewares/asyncHandler.js";
import { decodeBarcode } from "../services/decodeBarcode.service.js";
import { getProductDetail } from "../utils/getProductDetail.js";
import User from "../models/user.model.js";
import AiCache from "../models/aiCache.model.js";
import { geminiResponse } from "../services/geminiResponse.service.js";
import { getLatestRecipes } from "../services/reciepe.service.js";
import logger from "../utils/logger.js";
import { fetchProductsByCategory } from "../services/product.service.js";
import Product from "../models/product.model.js";

export const analyzeImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded. Please upload a valid product image.",
      });
    }

    const user = await User.findById(req.user._id).select(
      "-password -name -email -isEmailVerified -profileCompletion -createdAt -updatedAt -__v"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    const buffer = req.file.buffer;
    const barcode = await decodeBarcode(buffer);

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: "Unable to decode barcode. Try uploading a clearer image.",
      });
    }

    const cache = await AiCache.findOne({
      userId: user._id,
      productId: barcode,
      profileVersion: user.profileUpdateCount,
    });

    if (cache) {
      return res.status(200).json({
        success: true,
        analysis: cache.aiResponse,
        message: "Product analyzed successfully (from cache).",
      });
    }

    const productDetail = await getProductDetail(barcode);

    if (!productDetail.success) {
      return res.status(404).json({
        success: false,
        message: "Product not found in our database.",
      });
    }

    const analysis = await geminiResponse(productDetail.product, user);

    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to analyze product. Please try again later.",
      });
    }

    await AiCache.create({
      userId: user._id,
      productId: barcode.toString(),
      profileVersion: user.profileUpdateCount,
      aiResponse: analysis.analysis,
    });

    return res.status(200).json({
      success: true,
      analysis: analysis.analysis,
      message: "Product analyzed successfully.",
    });
  } catch (error) {
    console.error("❌ Error in analyzeImage:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while analyzing the product. Please try again.",
    });
  }
});

export const getReceipes = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const userProfile = await User.findById(userId).select(
      "-password -name -email -isEmailVerified -createdAt -updatedAt -__v"
    );

    const recipes = await getLatestRecipes(userId, userProfile);

    return res.status(200).json({
      success: true,
      recipes,
      message: "Receipes fetched successfully",
    });
  } catch (error) {
    logger.error("Receipes not fetched! Please try again", {
      error: error.message,
    });
    return res.status(404).json({
      success: false,
      message: "Something went wrong with receipes fetching",
    });
  }
});

export const getCategoryProducts = asyncHandler(async (req, res) => {
  try {
    const category = req.params.category;

    const results = await fetchProductsByCategory(category);

    return res.status(200).json({
      success: true,
      data: results.products,
      totalItems: results.total,
      message: `Products in category ${category} fetched successfully`,
    });
  } catch (error) {
    logger.error("Products not fetched! Please try again", {
      error: error.message,
    });
    return res.status(404).json({
      success: false,
      message: "Something went wrong with product fetching",
    });
  }
});

export const getProductAnalysis = asyncHandler(async (req, res) => {
  try {
    const productId = req.params.productId;

    const user = await User.findById(req.user._id).select(
      "-password -name -email -isEmailVerified -profileCompletion -createdAt -updatedAt -__v"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    const product = await Product.findById(productId).select(
      "-createdAt -updatedAt -__v"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const cache = await AiCache.findOne({
      userId: user._id,
      productId: product.barcode,
      profileVersion: user.profileUpdateCount,
    });

    if (cache) {
      return res.status(200).json({
        success: true,
        analysis: cache.aiResponse,
        message: "Product analyzed successfully (from cache).",
      });
    }

    const productDetail = await getProductDetail(product.barcode);

    if (!productDetail.success) {
      return res.status(404).json({
        success: false,
        message: "Product not found in our database.",
      });
    }

    const analysis = await geminiResponse(productDetail.product, user);

    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to analyze product. Please try again later.",
      });
    }

    await AiCache.create({
      userId: user._id,
      productId: product.barcode.toString(),
      profileVersion: user.profileUpdateCount,
      aiResponse: analysis.analysis,
    });

    return res.status(200).json({
      success: true,
      analysis: analysis.analysis,
      product: product,
      message: "Product analyzed successfully.",
    });
  } catch (error) {
    logger.error("Product analysis not fetched! Please try again", {
      error: error.message,
    });
    return res.status(404).json({
      success: false,
      message: "Something went wrong with product analysis fetching",
    });
  }
});
