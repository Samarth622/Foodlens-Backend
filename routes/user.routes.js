import express from "express";
import {
  registerUser,
  otpVerify,
  resendOTP,
  loginUser,
  getUser,
  logoutUser,
  editProfile,
  getProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);

userRouter.post("/verify", otpVerify);

userRouter.post("/resend-otp", resendOTP);

userRouter.post("/login", loginUser);

userRouter.get("/user", protect, getUser);

userRouter.post("/logout", protect, logoutUser);

userRouter.post("/edit-profile", protect, editProfile);

userRouter.get("/get-profile", protect, getProfile);

export default userRouter;
