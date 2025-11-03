import Product from "../models/product.model.js";
import logger from "../utils/logger.js";

export const fetchProductsByCategory = async (category, page = 1, limit = 20) => {
  if (!category) {
    logger.error("Category parameter is required");
    throw new Error("Category parameter is required");
  }

  const skip = (page - 1) * limit;

  try {
    const filter = { category: category };
    
    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProducts = await Product.countDocuments(filter);
    
    return {
      products: products,
      total: totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    };
  } catch (error) {
    logger.error(`Error fetching products by category: ${error.message}`);
    throw new Error("Could not fetch products by category");
  }
};
