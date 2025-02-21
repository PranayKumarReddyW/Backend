const Joi = require("joi");

const userValidationSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.base": "Name must be a string",
    "string.min": "Name must be at least 3 characters long",
    "any.required": "Name is required",
  }),
  registrationNumber: Joi.string().required().messages({
    "string.base": "Registration number must be a string",
    "any.required": "Registration number is required",
  }),
  branch: Joi.string()
    .valid("CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CSE DS")
    .required()
    .messages({
      "any.required": "Branch is required",
      "string.base": "Branch must be a string",
      "any.only":
        "Branch must be one of: CSE, ECE, EEE, MECH, CIVIL, IT,CSE DS",
    }),
  passedOutYear: Joi.number()
    .valid(2022, 2023, 2024, 2025, 2026)
    .required()
    .messages({
      "any.required": "Passed-out year is required",
      "number.base": "Passed-out year must be a number",
      "any.only":
        "Passed-out year must be one of: 2022, 2023, 2024, 2025, 2026",
    }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  phoneNumber: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be a 10-digit number",
      "any.required": "Phone number is required",
    }),
  password: Joi.string().min(6).required().messages({
    "string.base": "Password must be a string",
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

const coordinatorValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Coordinator name must be a string",
    "string.min": "Coordinator name must be at least 3 characters long",
    "string.max": "Coordinator name cannot exceed 100 characters",
    "any.required": "Coordinator name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Coordinator email is required",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be a 10-digit number",
      "any.required": "Coordinator phone is required",
    }),
  role: Joi.string()
    .valid("Lead", "Assistant", "Support", "Faculty")
    .required()
    .messages({
      "any.only": "Role must be one of: Lead, Assistant, Support, Faculty",
      "any.required": "Role is required",
    }),
  department: Joi.string()
    .valid("CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CSE DS")
    .required()
    .messages({
      "any.only":
        "Department must be one of: CSE, ECE, EEE, MECH, CIVIL, IT, CSE DS",
      "any.required": "Department is required",
    }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
  accessibleEvents: Joi.array().items(Joi.string().hex().length(24)).messages({
    "array.base": "Accessible events must be an array of event IDs",
    "string.hex": "Each event ID must be a valid ObjectId",
    "string.length": "Each event ID must be 24 characters long",
  }),
});

const eventValidationSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Event name is required",
    "string.min": "Event name must be at least 3 characters",
    "string.max": "Event name cannot exceed 100 characters",
  }),

  description: Joi.string().max(1000).required().messages({
    "string.empty": "Description is required",
    "string.max": "Description cannot exceed 1000 characters",
  }),

  date: Joi.date().greater("now").required().messages({
    "date.base": "Invalid date format",
    "date.greater": "Event date must be in the future",
    "any.required": "Event date is required",
  }),

  startTime: Joi.string()
    .pattern(/^([01]?\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.empty": "Start time is required",
      "string.pattern.base": "Invalid time format (HH:MM)",
    }),

  endTime: Joi.string()
    .pattern(/^([01]?\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.empty": "End time is required",
      "string.pattern.base": "Invalid time format (HH:MM)",
    }),

  venue: Joi.string().max(100).required().messages({
    "string.empty": "Venue is required",
    "string.max": "Venue cannot exceed 100 characters",
  }),

  maxParticipants: Joi.number().integer().min(1).required().messages({
    "number.base": "Maximum participants must be a number",
    "number.integer": "Maximum participants must be an integer",
    "number.min": "At least one participant is required",
  }),

  registrationDeadline: Joi.date().less(Joi.ref("date")).required().messages({
    "date.base": "Invalid registration deadline format",
    "date.less": "Registration deadline must be before the event date",
    "any.required": "Registration deadline is required",
  }),

  coordinators: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one coordinator is required",
      "string.hex": "Invalid coordinator ID format",
      "string.length": "Invalid coordinator ID length",
    }),

  category: Joi.string()
    .valid("Technical", "Cultural", "Sports", "Workshop", "Other")
    .required()
    .messages({
      "any.only": "Invalid category",
      "any.required": "Category is required",
    }),

  registrationType: Joi.string().valid("Free", "Paid").required().messages({
    "any.only": "Invalid registration type",
    "any.required": "Registration type is required",
  }),

  registrationFee: Joi.number()
    .min(0)
    .default(0)
    .when("registrationType", {
      is: "Paid",
      then: Joi.number().greater(0).required(),
    })
    .messages({
      "number.base": "Registration fee must be a number",
      "number.min": "Registration fee cannot be negative",
      "number.greater": "Paid events must have a positive registration fee",
    }),

  rules: Joi.array().items(Joi.string()).min(1).required().messages({
    "array.min": "At least one rule must be specified",
    "array.base": "Rules must be an array of strings",
  }),

  contactEmail: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Contact email is required",
  }),

  contactPhone: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid phone number format",
      "any.required": "Contact phone is required",
    }),

  branches: Joi.array()
    .items(
      Joi.string().valid(
        "CSE",
        "IT",
        "ECE",
        "EEE",
        "MECH",
        "CIVIL",
        "BIO",
        "AI&DS",
        "Other"
      )
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one branch must be selected",
      "any.only": "Invalid branch name",
    }),

  years: Joi.array()
    .items(Joi.number().valid(1, 2, 3, 4))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one year must be selected",
      "any.only": "Invalid year value",
    }),
  eventImage: Joi.string().required().messages({
    "string.empty": "Event image is required",
  }),
});

module.exports = {
  userValidationSchema,
  coordinatorValidationSchema,
  eventValidationSchema,
};
