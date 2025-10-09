import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import User from "../models/user.model.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.token;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token invalid", err.message);
  }
});

