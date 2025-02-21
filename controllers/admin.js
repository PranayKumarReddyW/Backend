const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");

// Register Admin (Only one allowed)
exports.registerAdmin = async (req, res) => {
  try {
    // Check if an admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(403).json({ message: "Admin already exists" });
    }

    // Extract data from request body
    const { name, email, phoneNumber, password } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create new admin
    const admin = new Admin({ name, email, phoneNumber, password });

    await admin.save();

    res.status(201).json({ message: "Admin registered successfully", admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: admin._id, role: "Admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: "Login successful", admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
