import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import compression from "compression";
import logger from "../utils/logger.js";
import errorHandler from "../middlewares/errorHandler.js";
import connectDB from "../db/dbConfig.js";
import userRouter from "../routes/user.routes.js";
import productRouter from "../routes/product.routes.js";
import "../services/cron.service.js";

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = ["http://localhost:5173", "https://www.foodlens.in", "https://foodlens.in"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) return callback(new Error("CORS blocked!"), false);
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
  app.use(limiter);
} else {
  logger.info("⚠️ Rate limiter disabled in dev mode");
}

app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.use(errorHandler);

// Routes
app.get("/", (req, res) => res.send("Backend is running ✅"));
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);

export const handler = serverless(app);

// ----------------- LOCAL TESTING -----------------
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Local server running on port ${PORT}`);
  });
}
