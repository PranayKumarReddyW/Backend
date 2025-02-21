const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      minlength: [3, "Event name must be at least 3 characters"],
      maxlength: [100, "Event name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Event date must be in the future",
      },
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]?\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]?\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)"],
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      maxlength: [100, "Venue cannot exceed 100 characters"],
    },
    maxParticipants: {
      type: Number,
      required: [true, "Maximum participants is required"],
      min: [1, "At least one participant is required"],
      validate: {
        validator: Number.isInteger,
        message: "Maximum participants must be an integer",
      },
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
      validate: {
        validator: function (value) {
          return value < this.date;
        },
        message: "Registration deadline must be before the event date",
      },
    },
    coordinators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coordinator",
        required: [true, "At least one coordinator is required"],
      },
    ],
    category: {
      type: String,
      enum: {
        values: ["Technical", "Cultural", "Sports", "Workshop", "Other"],
        message: "Invalid category",
      },
      required: [true, "Category is required"],
    },
    registrationType: {
      type: String,
      enum: {
        values: ["Free", "Paid"],
        message: "Invalid registration type",
      },
      required: [true, "Registration type is required"],
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: [0, "Registration fee cannot be negative"],
      validate: {
        validator: function (value) {
          return this.registrationType === "Paid" ? value > 0 : value === 0;
        },
        message: "Paid events must have a positive registration fee",
      },
    },
    rules: {
      type: [String],
      required: [true, "Event rules are required"],
      validate: {
        validator: function (rules) {
          return rules.length > 0;
        },
        message: "At least one rule must be specified",
      },
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      match: [/^\d{10}$/, "Invalid phone number format"],
    },
    branches: {
      type: [String],
      enum: [
        "CSE",
        "CSE DS",
        "ECE",
        "EEE",
        "MECH",
        "CIVIL",
        "AIML",
        "CSE BS",
        "CYBER SECURITY",
      ],
      required: [true, "At least one branch must be selected"],
    },
    years: {
      type: [Number],
      enum: [1, 2, 3, 4],
      required: [true, "At least one year must be selected"],
    },
    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    eventImage: {
      type: String,
      required: [true, "Event image is required"],
    },
  },
  { timestamps: true }
);

// Schema Methods

// Check if event is upcoming
eventSchema.methods.isUpcoming = function () {
  return this.date > new Date();
};

// Get formatted event timings
eventSchema.methods.getEventTimings = function () {
  return `${this.startTime} - ${this.endTime}`;
};

// Check if registration is open
eventSchema.methods.isRegistrationOpen = function () {
  return new Date() < this.registrationDeadline;
};

module.exports = mongoose.model("Event", eventSchema);
