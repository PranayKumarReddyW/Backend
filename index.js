const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const MERCHANT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const MERCHANT_ID = "PGTESTPAYUAT86";

const MERCHANT_BASE_URL =
  "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
const MERCHANT_STATUS_URL =
  "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status";

const redirectUrl = "http://localhost:4000/status";
const successUrl = "http://localhost:5173/payment-success";
const failureUrl = "http://localhost:5173/payment-failure";

app.post("/create-order", async (req, res) => {
  const { name, mobileNumber, amount, userId } = req.body;
  const orderId = uuidv4();

  // Payment payload
  const paymentPayload = {
    merchantId: MERCHANT_ID,
    merchantUserId: name,
    mobileNumber: mobileNumber,
    amount: amount * 100,
    merchantTransactionId: orderId,
    redirectUrl: `${redirectUrl}/?id=${orderId}&userId=${userId}`, // Include userId
    redirectMode: "POST",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const payload = Buffer.from(JSON.stringify(paymentPayload)).toString(
    "base64"
  );
  const keyIndex = 1;
  const string = payload + "/pg/v1/pay" + MERCHANT_KEY;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = sha256 + "###" + keyIndex;

  const option = {
    method: "POST",
    url: MERCHANT_BASE_URL,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
    },
    data: {
      request: payload,
    },
  };

  try {
    const response = await axios.request(option);
    res.status(200).json({
      msg: "OK",
      url: response.data.data.instrumentResponse.redirectInfo.url,
    });
  } catch (error) {
    console.log("Error initiating payment", error);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

const Payment = require("./models/payment");
const User = require("./models/user");
const Event = require("./models/event");

app.post("/status", async (req, res) => {
  const { id: merchantTransactionId, userId } = req.query; // Extract userId from query params

  const keyIndex = 1;
  const string =
    `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + MERCHANT_KEY;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = sha256 + "###" + keyIndex;

  const option = {
    method: "GET",
    url: `${MERCHANT_STATUS_URL}/${MERCHANT_ID}/${merchantTransactionId}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": MERCHANT_ID,
    },
  };

  try {
    const response = await axios.request(option);
    const paymentStatus = response.data.success ? "success" : "failure";

    // Find the corresponding order from the database (if any) and save the payment status
    const payment = await Payment.findOne({ orderId: merchantTransactionId });

    if (payment) {
      payment.paymentStatus = paymentStatus;
      await payment.save(); // Update the payment status in the database
    } else {
      console.log("No payment record found for this order");
    }

    // Find the user by userId
    const user = await User.findById(userId); // Use userId from query params
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (paymentStatus === "success") {
      // Find the event associated with the payment
      const event = await Event.findById(payment.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Add the event to the user's registered events
      user.registeredEvents.push(payment.eventId);
      await user.save();

      // Update the event's participant count
      event.participantsCount += 1;
      await event.save();

      return res.redirect(successUrl); // Redirect to success URL
    } else {
      return res.redirect(failureUrl); // Redirect to failure URL
    }
  } catch (error) {
    console.error("Error verifying payment status:", error);
    res.status(500).json({ error: "Failed to verify payment status" });
  }
});

app.use("/api/users", require("./routes/user"));
app.use("/api/coordinator", require("./routes/coordinator"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/events", require("./routes/event"));

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
