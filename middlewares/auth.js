const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Coordinator = require("../models/coordinator");
const Admin = require("../models/admin");

const studentAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: "Please login!" });
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Session expired, please login again!" });
      }
      return res.status(400).json({ message: "Invalid token!" });
    }

    const { _id, role } = decodedObj;

    if (role !== "Student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const coordinatorAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: "Please login!" });
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Session expired, please login again!" });
      }
      return res.status(400).json({ message: "Invalid token!" });
    }

    const { _id, role } = decodedObj;

    if (role !== "Coordinator") {
      return res.status(403).json({ message: "Access denied" });
    }

    const coordinator = await Coordinator.findById(_id);
    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator not found" });
    }

    req.coordinator = coordinator;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: "Please login!" });
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Session expired, please login again!" });
      }
      return res.status(400).json({ message: "Invalid token!" });
    }

    const { _id, role } = decodedObj;

    if (role !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const admin = await Admin.findById(_id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = { studentAuth, coordinatorAuth, adminAuth };
