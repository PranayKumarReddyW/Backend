const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { userValidationSchema } = require("../utils/validation");

// User Registration
exports.registerUser = async (req, res) => {
  const { error } = userValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const {
    name,
    registrationNumber,
    branch,
    passedOutYear,
    email,
    phoneNumber,
    password,
  } = req.body;

  try {
    const existingEmail = await User.findByEmail(email);
    if (existingEmail)
      return res.status(400).json({ message: "Email already in use" });

    const existingRegistrationNumber = await User.findByRegistrationNumber(
      registrationNumber
    );
    if (existingRegistrationNumber)
      return res
        .status(400)
        .json({ message: "Registration number already in use" });

    const existingPhoneNumber = await User.findByPhoneNumber(phoneNumber);
    if (existingPhoneNumber)
      return res.status(400).json({ message: "Phone number already in use" });

    const user = new User({
      name,
      registrationNumber,
      branch,
      passedOutYear,
      email,
      phoneNumber,
      password,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Login API
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { _id: user._id, role: "Student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      maxAge: 3600000,
    });
    console.log(token);

    res.status(200).json({ message: "Login successful", user: user.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Logout API
exports.logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    sameSite: "Strict",
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logout successful" });
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ branch: req.coordinator.department });

    if (!users.length)
      return res.status(404).json({ message: "No users found" });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    if (!users.length)
      return res.status(404).json({ message: "No users found" });

    res.status(200).json(users);
  } catch (error) {}
};

exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      branch,
      phoneNumber,
      password,
      registrationNumber,
      passedOutYear,
      email,
    } = req.body;
    const user = req.user;

    // Check if the provided email is already in use by another user
    if (email && email !== user.email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Check if the provided phone number is already in use by another user
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingPhoneNumber = await User.findByPhoneNumber(phoneNumber);
      if (existingPhoneNumber) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      user.phoneNumber = phoneNumber;
    }

    // Check if the provided registration number is already in use by another user
    if (registrationNumber && registrationNumber !== user.registrationNumber) {
      const existingRegistrationNumber = await User.findByRegistrationNumber(
        registrationNumber
      );
      if (existingRegistrationNumber) {
        return res
          .status(400)
          .json({ message: "Registration number already in use" });
      }
      user.registrationNumber = registrationNumber;
    }

    // Update other fields if provided
    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (passedOutYear) user.passedOutYear = passedOutYear;
    if (password) user.password = password; // Assuming hashing is handled in the model

    await user.save();

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: user.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Profile fetched successfully",
      user: req.user.toJSON(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
