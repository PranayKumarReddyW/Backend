const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event");
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

router.post("/event", eventController.createEvent);
router.get("/events", studentAuth, eventController.getEvents);
// router.get("/allevents", allowCoordinatorOrAdmin, eventController.getAllEvents);
router.get("/event/:id", studentAuth, eventController.getEventById);
// router.put("/event/:id", coordinatorAuth, eventController.updateEvent);
// router.delete("/event/:id", coordinatorAuth, eventController.deleteEvent);
// router.get(
//   "/events/:department",
//   studentAuth,
//   eventController.getEventsByDepartment
// );
router.post("/register/:id", studentAuth, eventController.registerForEvent);
module.exports = router;
