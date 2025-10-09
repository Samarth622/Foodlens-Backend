import axios from "axios";
import logger from "../utils/logger.js";

export const getProductDetail = async (barcode) => {
  try {
    if (!barcode || typeof barcode !== "string") {
      logger.warn("Invalid barcode provided", { barcode });
      return {
        success: false,
        message: "Invalid barcode provided",
      };
    }

    const { data } = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}`
    );

    if (!data || !data.product) {
      logger.warn("Product not found in Open Food Facts database", { barcode });
      return {
        success: false,
        message: "Product not found in Open Food Facts database",
      };
    }

    const product = data.product;

    const filteredData = {
      name: product.product_name || null,
      quantity: product.nutrition_data_per || null,
      ingredients_text: product.ingredients_text,
      nutrients: product.nutriments || null,
      image_url: product.image_url,
      allergens: product.allergens,
    };

    if (
      !filteredData.name ||
      !filteredData.nutrients
    ) {
      logger.warn("Product detail incomplete", { barcode, filteredData });
      return {
        success: false,
        message: "Product detail is not present",
      };
    }

    return {
      success: true,
      product: filteredData,
      message: "Product details fetched successfully",
    };
  } catch (error) {
    logger.error("Error fetching product details", { message: error.message, stack: error.stack, barcode });

    if (error.response) {
      return {
        success: false,
        message: `Open Food Facts API error: ${error.response.status} ${error.response.statusText}`,
      };
    } else if (error.request) {
      return {
        success: false,
        message: "No response from Open Food Facts API. Please try again later.",
      };
    } else {
      return {
        success: false,
        message: "Unexpected error occurred while fetching product details",
      };
    }
  }
};
