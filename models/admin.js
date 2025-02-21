const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
      minlength: [3, "Admin name must be at least 3 characters long"],
      maxlength: [100, "Admin name cannot exceed 100 characters"],
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
      minlength: [8, "Password must be at least 8 characters long"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure there is only **one admin** in the system
adminSchema.pre("save", async function (next) {
  const adminCount = await mongoose.model("Admin").countDocuments();
  if (adminCount > 0) {
    return next(new Error("Only one admin is allowed in the system"));
  }

  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// **Method to Compare Password**
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// **Method to Hide Password in Response**
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// **Static Method to Get the Admin**
adminSchema.statics.getAdmin = function () {
  return this.findOne();
};

module.exports = mongoose.model("Admin", adminSchema);
