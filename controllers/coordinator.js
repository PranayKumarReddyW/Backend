const jwt = require("jsonwebtoken");

const Coordinator = require("../models/coordinator");
const { coordinatorValidationSchema } = require("../utils/validation");

// Register Coordinator API
exports.registerCoordinator = async (req, res) => {
  const { error } = coordinatorValidationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { name, email, phone, role, department, password } = req.body;

  try {
    const existingEmail = await Coodrinator.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email already in use" });

    const existingPhoneNumber = await Coodrinator.findOne({ phone });
    if (existingPhoneNumber)
      return res.status(400).json({ message: "Phone number already in use" });

    const coordinator = new Coodrinator({
      name,
      email,
      phone,
      role,
      department,
      password,
    });

    await coordinator.save();

    res.status(201).json({
      message: "Coordinator registered successfully",
      coordinator: coordinator.toJSON(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Coordinator Login API
exports.loginCoordinator = async (req, res) => {
  const { email, password } = req.body;

  try {
    const coordinator = await Coodrinator.findOne({ email });
    if (!coordinator)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await coordinator.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { _id: coordinator._id, role: "Coordinator" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 3600000,
    });

    res
      .status(200)
      .json({ message: "Login successful", coordinator: coordinator.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Coordinator Logout API
exports.logoutCoordinator = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    sameSite: "Strict",
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logout successful" });
};

exports.getCoordinatorByID = async (req, res) => {
  try {
    const coordinator = await Coordinator.findOne({ _id: req.params.id });
    if (!coordinator)
      return res.status(404).json({ message: "Coordinator not found" });

    res.status(200).json(coordinator.toJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCoordinators = async (req, res) => {
  try {
    const coordinators = await Coordinator.find({});
    if (!coordinators.length)
      return res.status(404).json({ message: "No coordinators found" });

    res.status(200).json(coordinators);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
