import express from "express";
import { upload } from "../services/multer.service.js";
import { analyzeImage, getReceipes } from "../controllers/analysis.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const productRouter = express.Router();

productRouter.post("/upload-analysis", protect, upload.single("image"), analyzeImage);

productRouter.get("/get-recipes", protect, getReceipes);


export default productRouter;