const Event = require("../models/event");
const { eventValidationSchema } = require("../utils/validation");
const User = require("../models/user");
const Coordinator = require("../models/coordinator");

// Create Event
exports.createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      maxParticipants,
      registrationDeadline,
      coordinators,
      category,
      registrationType,
      registrationFee,
      rules,
      contactEmail,
      contactPhone,
      branches,
      eventImage,
      years,
    } = req.body;

    // Validate request data
    const { error } = eventValidationSchema.validate({
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      maxParticipants,
      registrationDeadline,
      coordinators,
      category,
      registrationType,
      registrationFee,
      rules,
      contactEmail,
      contactPhone,
      branches,
      years,
      eventImage,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation Error",
        errors: error.details.map((err) => err.message),
      });
    }

    // Create and save new event
    const newEvent = new Event({
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      maxParticipants,
      registrationDeadline,
      coordinators,
      category,
      eventImage,
      registrationType,
      registrationFee: registrationType === "Paid" ? registrationFee : 0,
      rules,
      contactEmail,
      contactPhone,
      branches,
      years,
    });
    // Check if coordinators exist
    const coordinatorExists = await Coordinator.find({
      _id: { $in: coordinators },
    });
    if (coordinatorExists.length !== coordinators.length) {
      return res.status(400).json({
        message: "Coordinator not found",
      });
    }

    // Check if coordinators are already assigned to an event
    const coordinator = await Event.find({
      coordinators: { $in: coordinators },
    });
    if (coordinator.length) {
      return res.status(400).json({
        message: "Coordinator is already assigned to an event",
      });
    }
    await newEvent.save();

    res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get Events (with optional filtering & sorting)
exports.getEvents = async (req, res) => {
  try {
    // const { branch, passedOutYear } = req.user;
    // year = passedOutYear - 2021;
    const filters = {
      // branches: { $in: [branch] },
      // years: { $in: [year] },
    };
    // Fetch events from DB
    const events = await Event.find(filters).sort({ date: 1 }).select("-__v");
    if (!events.length) {
      return res
        .status(404)
        .json({ message: "No events found for your department & year" });
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get Event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select("-__v");
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Register for event
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.date < new Date())
      return res.status(400).json({ message: "Event registration closed" });
    if (event.maxParticipants <= event.registeredUsers.length)
      return res.status(400).json({ message: "Event registration full" });
    // if (event.registrationType === "Paid" && !req.body.paymentId)
    //   return res.status(400).json({ message: "Payment ID is required" });

    // Check if user is already registered
    if (event.registeredUsers.includes(req.user._id)) {
      return res.status(400).json({ message: "User already registered" });
    }
    // check if user exists
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Promise.all([
      User.findByIdAndUpdate(
        req.user._id,
        { $push: { registeredEvents: event._id } },
        { new: true }
      ),
      Event.findByIdAndUpdate(
        req.params.id,
        { $push: { registeredUsers: req.user._id } },
        { new: true }
      ),
    ]);

    res.status(200).json({ message: "Registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
