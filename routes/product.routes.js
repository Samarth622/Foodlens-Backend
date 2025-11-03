import express from "express";
import { upload } from "../services/multer.service.js";
import { analyzeImage, getReceipes, getCategoryProducts, getProductAnalysis } from "../controllers/analysis.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const productRouter = express.Router();

productRouter.post("/upload-analysis", protect, upload.single("image"), analyzeImage);

productRouter.get("/get-recipes", protect, getReceipes);

productRouter.get("/category/:category", protect, getCategoryProducts);

productRouter.get("/analysis/:productId", protect, getProductAnalysis);


export default productRouter;