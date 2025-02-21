const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const coordinatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Coordinator name is required"],
      trim: true,
      minlength: [3, "Coordinator name must be at least 3 characters"],
      maxlength: [100, "Coordinator name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Coordinator email is required"],
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "Coordinator phone is required"],
      match: [/^\d{10}$/, "Invalid phone number format"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["Lead", "Assistant", "Support", "Faculty"],
        message: "Invalid role",
      },
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: {
        values: ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "CSE DS"],
        message: "Invalid department",
      },
      trim: true,
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    accessibleEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
      },
    ],
  },

  { timestamps: true }
);

// Pre-save hook to hash the password before saving to the database
coordinatorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Methods for the Coordinator Schema

// Method to compare password
coordinatorSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to hide sensitive fields when sending JSON response
coordinatorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Check if the coordinator is part of a specific event
coordinatorSchema.methods.isCoordinatorOfEvent = function (eventId) {
  return this.accessibleEvents.includes(eventId);
};

// Add an event to the coordinator's accessible events list
coordinatorSchema.methods.addEvent = async function (eventId) {
  if (!this.accessibleEvents.includes(eventId)) {
    this.accessibleEvents.push(eventId);
    await this.save();
  }
};

// Remove an event from the coordinator's accessible events list
coordinatorSchema.methods.removeEvent = async function (eventId) {
  this.accessibleEvents = this.accessibleEvents.filter(
    (event) => event.toString() !== eventId.toString()
  );
  await this.save();
};

// Static method to get all coordinators in a specific department
coordinatorSchema.statics.findByDepartment = function (department) {
  return this.find({ department });
};

// Instance method to compare the given password with the stored password
coordinatorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update coordinator profile
coordinatorSchema.methods.updateProfile = async function (updatedData) {
  Object.keys(updatedData).forEach((key) => {
    if (this[key] && updatedData[key]) {
      this[key] = updatedData[key];
    }
  });
  await this.save();
};

// Instance method to change the coordinator's password
coordinatorSchema.methods.changePassword = async function (newPassword) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
  await this.save();
};

module.exports = mongoose.model("Coordinator", coordinatorSchema);
