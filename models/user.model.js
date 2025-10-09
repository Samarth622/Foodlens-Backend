import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    gender: {
      type: String,
      required: [true, "Please specify a gender"],
      enum: ["male", "female", "other"],
    },
    isEmailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    basicInfo: {
      weight: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      age: { type: Number, default: 0 },
      activityLevel: {
        type: String,
        default: "",
        enum: [
          "Sedentary",
          "Lightly Active",
          "Moderately Active",
          "Very Active",
          ""
        ],
      },
    },
    healthGoals: {
      primaryGoal: {
        type: String,
        default: "",
        enum: ["Lose Weight", "Gain Muscle", "Maintain Weight", ""],
      },
      targetWeight: { type: Number },
    },
    dietaryPreferences: {
      dietType: {
        type: String,
        default: "",
        enum: ["Vegetarian", "Vegan", "Keto", "Paleo", "Other", ""],
      },
      foodPreferences: [{ type: String }],
    },
    allergies: [{ type: String }],
    medicalInfo: {
      medicalConditions: [{ type: String }],
      currentMedications: { type: String },
      medicalHistory: { type: String },
    },
    lifestyle: {
      sleepHours: { type: Number },
      stressLevel: { type: Number },
      waterIntake: { type: Number },
    },
    profileCompletion: { type: Number, default: 0 },
    profileUpdateCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
