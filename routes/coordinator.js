const express = require("express");
const router = express.Router();
const coordinatorController = require("../controllers/coordinator");
const { coordinatorAuth, adminAuth } = require("../middlewares/auth");
router.post("/register", coordinatorController.registerCoordinator);
router.post("/login", coordinatorController.loginCoordinator);
router.post("/logout", coordinatorController.logoutCoordinator);
router.get(
  "/coordinator/:id",
  coordinatorAuth,
  coordinatorController.getCoordinatorByID
);
router.get("/coordinator", adminAuth, coordinatorController.getCoordinators);

module.exports = router;
