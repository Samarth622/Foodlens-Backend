import Product from "../models/product.model.js";
import logger from "../utils/logger.js";

export const fetchProductsByCategory = async (category) => {
  if (!category) {
    logger.error("Category parameter is required");
    throw new Error("Category parameter is required");
  }
  try {
    const filter = { category: category };
    
    const products = await Product.find(filter)
    const totalProducts = await Product.countDocuments(filter);
    
    return {
      products: products,
      total: totalProducts,
    };
  } catch (error) {
    logger.error(`Error fetching products by category: ${error.message}`);
    throw new Error("Could not fetch products by category");
  }
};
