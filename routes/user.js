const express = require("express");
const router = express.Router();
const coordinatorController = require("../controllers/coordinator");
const userController = require("../controllers/user");
const {
  studentAuth,
  coordinatorAuth,
  adminAuth,
} = require("../middlewares/auth");

// Middleware to allow either coordinator or admin
const allowCoordinatorOrAdmin = (req, res, next) => {
  coordinatorAuth(req, res, (err) => {
    if (!err) return next();
    adminAuth(req, res, next);
  });
};

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.post("/logout", userController.logoutUser);

router.get("/user", studentAuth, userController.getUser);
router.get("/user/:id", allowCoordinatorOrAdmin, userController.getUserById);

// department wise users
router.get("/users", coordinatorAuth, userController.getUsers);

// router.get("user/:department", adminAuth, userController.getUsersByDepartment);
router.get("/allusers", adminAuth, userController.getAllUsers);

router.put("/user", studentAuth, userController.updateUser);
module.exports = router;

router.post("/attendance", userController.markAttendance);
