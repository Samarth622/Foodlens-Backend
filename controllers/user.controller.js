import asyncHandler from "../middlewares/asyncHandler.js";
import {
  loginUserSchema,
  registerUserSchema,
  resendOtpSchema,
} from "../utils/validation.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { generateOTP } from "../utils/generateOTP.js";
import TempUser from "../models/tempUser.model.js";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { error, value } = registerUserSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400);
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    throw new Error(`Validation failed: ${errorMessage}`);
  }

  const { name, email, password, gender } = value;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409);
    throw new Error("An account with this email already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const otp = generateOTP();

  await TempUser.findOneAndUpdate(
    { email },
    {
      name,
      password: hashedPassword,
      gender,
      otp,
      expireAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    const emailSubject = `Your Verification Code for Foodlens`;
    const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2>Email Verification Required</h2>
                <p>Hello ${name},</p>
                <p>Thank you for starting the registration process. Please use the following One-Time Password (OTP) to confirm your email address:</p>
                <p style="background-color: #f2f2f2; border-radius: 5px; padding: 10px 15px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0;">${otp}</p>
                <p>This code is valid for <strong>10 minutes</strong>.</p>
                <hr>
                <p style="font-size: 0.9em; color: #777;">If you did not request this, you can safely ignore this email.</p>
            </div>`;

    await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: `Hello ${name},\n\nYour One-Time Password (OTP) is: ${otp}. This code is valid for 10 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "An OTP has been sent to your email address for verification.",
    });
  } catch (emailError) {
    console.error("Email sending error:", emailError);
    res.status(500);
    throw new Error(
      "There was an issue sending the verification email. Please try again later."
    );
  }
});

export const otpVerify = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required" });
  }

  const tempUser = await TempUser.findOne({ email });
  if (!tempUser) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email or session expired" });
  }

  if (tempUser.expireAt < Date.now()) {
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new one.",
    });
  }

  if (tempUser.otp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await TempUser.deleteOne({ email });
    return res.status(200).json({
      success: true,
      message: "User already verified",
      user: existingUser,
    });
  }

  const user = await User.create({
    name: tempUser.name,
    email: tempUser.email,
    password: tempUser.password,
    gender: tempUser.gender,
    isEmailVerified: true,
  });

  await TempUser.deleteOne({ email });

  return res.status(201).json({
    success: true,
    user: {
      _id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

export const resendOTP = asyncHandler(async (req, res) => {
  const { error } = resendOtpSchema.validate(req.body);
  if (error) {
    res.status(400);
    throw new Error(error.details[0].message);
  }

  const { email } = req.body;

  const tempUser = await TempUser.findOne({ email });

  if (!tempUser) {
    res.status(404);
    throw new Error(
      "No pending registration found for this email. Please register again."
    );
  }

  const newOtp = generateOTP();

  tempUser.otp = newOtp;
  tempUser.expireAt = new Date(Date.now() + 10 * 60 * 1000);

  await tempUser.save();

  try {
    const emailSubject = `Your Verification Code for Foodlens`;
    const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2>Email Verification Required</h2>
                <p>Hello ${tempUser.name},</p>
                <p>Thank you for starting the registration process. Please use the following One-Time Password (OTP) to confirm your email address:</p>
                <p style="background-color: #f2f2f2; border-radius: 5px; padding: 10px 15px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0;">${newOtp}</p>
                <p>This code is valid for <strong>10 minutes</strong>.</p>
                <hr>
                <p style="font-size: 0.9em; color: #777;">If you did not request this, you can safely ignore this email.</p>
            </div>`;

    await sendEmail({
      to: tempUser.email,
      subject: emailSubject,
      text: `Hello ${tempUser.name},\n\nYour One-Time Password (OTP) is: ${newOtp}. This code is valid for 10 minutes.`,
      html: emailHtml,
    });

    res.status(200).json({
      message: "A new OTP has been successfully sent to your email.",
    });
  } catch (emailError) {
    console.error(emailError);
    res.status(500);
    throw new Error("Failed to send email. Please try again.");
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const { error, value } = loginUserSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    res.status(400);
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");
    throw new Error(`Validation failed: ${errorMessage}`);
  }

  const { email, password } = value;

  const userExists = await User.findOne({ email });
  if (!userExists) {
    res.status(409);
    throw new Error("An Account with this email does not exist.");
  }

  const isPasswordValid = await bcrypt.compare(password, userExists.password);
  if (!isPasswordValid) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  const token = jwt.sign({ id: userExists._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: userExists._id,
      name: userExists.name,
      email: userExists.email,
    },
  });
});

export const getUser = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { _id, name, email, createdAt, updatedAt } = user;

    res.status(200).json({
      success: true,
      user: { _id, name, email, createdAt, updatedAt },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const editProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const {
    basicInfo = {},
    healthGoals = {},
    dietaryPreferences = {},
    allergies = [],
    medicalInfo = {},
    lifestyle = {},
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.basicInfo = {
    ...user.basicInfo,
    ...(basicInfo &&
      (({ weight, height, age, activityLevel }) => ({
        weight,
        height,
        age,
        activityLevel,
      }))(basicInfo)),
  };
  user.healthGoals = {
    ...user.healthGoals,
    ...(healthGoals &&
      (({ primaryGoal, targetWeight }) => ({ primaryGoal, targetWeight }))(
        healthGoals
      )),
  };
  user.dietaryPreferences = {
    ...user.dietaryPreferences,
    ...(dietaryPreferences &&
      (({ dietType, foodPreferences }) => ({ dietType, foodPreferences }))(
        dietaryPreferences
      )),
  };
  user.allergies = Array.isArray(allergies) ? allergies : user.allergies;
  user.medicalInfo = {
    ...user.medicalInfo,
    ...(medicalInfo &&
      (({ medicalConditions, currentMedications, medicalHistory }) => ({
        medicalConditions,
        currentMedications,
        medicalHistory,
      }))(medicalInfo)),
  };
  user.lifestyle = {
    ...user.lifestyle,
    ...(lifestyle &&
      (({ sleepHours, stressLevel, waterIntake }) => ({
        sleepHours,
        stressLevel,
        waterIntake,
      }))(lifestyle)),
  };

  const fieldsToCheck = [
    user.basicInfo,
    user.healthGoals,
    user.dietaryPreferences,
    user.allergies,
    user.medicalInfo,
    user.lifestyle,
  ];
  let completion = 0;
  fieldsToCheck.forEach((field) => {
    if (field && Object.keys(field).length > 0) {
      completion += 20;
    }
  });
  user.profileCompletion = Math.min(completion, 100);
  user.profileUpdateCount += 1;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    profileCompletion: user.profileCompletion,
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select(
    "-password -isEmailVerified -gender -name -email -__v -createdAt -updatedAt"
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json({
    success: true,
    profile: user,
  });
});
