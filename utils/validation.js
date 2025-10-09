import Joi from "joi";

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required().messages({
    "string.base": `"name" should be a type of 'text'`,
    "string.empty": `"name" cannot be an empty field`,
    "string.min": `"name" should have a minimum length of 3`,
    "any.required": `"name" is a required field`,
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": `"email" must be a valid email`,
      "any.required": `"email" is a required field`,
    }),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .required()
    .messages({
      "string.pattern.base": `"password" must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character and be at least 8 characters long`,
      "any.required": `"password" is a required field`,
    }),
  gender: Joi.string().valid("male", "female", "other").required().messages({
    "any.only": `"gender" must be one of [male, female, other]`,
    "any.required": `"gender" is a required field`,
  }),
});

export const loginUserSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().required(),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
});
