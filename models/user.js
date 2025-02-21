const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [3, "Name must be at least 3 characters long"],
  },
  registrationNumber: {
    type: String,
    required: [true, "Registration number is required"],
    unique: true,
    trim: true,
  },
  branch: {
    type: String,
    enum: ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CSE DS"],
    required: [true, "Branch is required"],
  },
  passedOutYear: {
    type: Number,
    enum: [2022, 2023, 2024, 2025, 2026],
    required: [true, "Passed-out year is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please enter a valid email address",
    ],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    unique: true,
    match: [/^\d{10}$/, "Phone number must be a 10-digit number"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  registeredEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to hide sensitive fields when sending JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

// Static method to find user by registration number
userSchema.statics.findByRegistrationNumber = function (registrationNumber) {
  return this.findOne({ registrationNumber });
};

userSchema.statics.findByPhoneNumber = function (phoneNumber) {
  return this.findOne({ phoneNumber });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
