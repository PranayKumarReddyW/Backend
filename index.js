const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const User = require("./models/user");
require("dotenv").config();
const qrcode = require("qrcode");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const FE_URL = process.env.FE_URL;
const MERCHANT_KEY = process.env.MERCHANT_KEY;
const MERCHANT_ID = process.env.MERCHANT_ID;
const MERCHANT_BASE_URL = process.env.MERCHANT_BASE_URL;
const MERCHANT_STATUS_URL = process.env.MERCHANT_STATUS_URL;
const redirectUrl = process.env.REDIRECT_URL;
const LOCAL_HOST = process.env.LOCAL_HOST; // Assuming LOCAL_HOST is set in your .env file.

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5175",
    credentials: true,
  })
);

app.post("/send-qr-code", (req, res) => {
  const { data, receiverEmail } = req.body;

  if (!data || !receiverEmail) {
    return res
      .status(400)
      .json({ message: "Data and receiverEmail are required." });
  }

  const imgPath = "qr_code.png";

  // Convert the data object to a JSON string before generating QR code
  const dataString = JSON.stringify(data);

  // Generate the QR code
  qrcode.toFile(imgPath, dataString, function (err) {
    if (err) {
      console.error("Error generating QR code:", err);
      return res.status(500).json({ message: "Error generating QR code" });
    }

    // Create a transporter object for nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Sender's email address
        pass: process.env.EMAIL_PASS, // Sender's email password (Use app-specific password for Gmail)
      },
    });

    // Define the email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: receiverEmail, // Receiver's email address from the request body
      subject: "QR Code Attachment",
      text: "Please find the attached QR code with your details.",
      attachments: [
        {
          filename: "qr_code.png",
          path: imgPath, // Path to the generated QR code image
        },
      ],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).json({ message: "Email sent successfully!" });
      }

      // Optionally, delete the image after sending the email
      fs.unlinkSync(imgPath);
    });
  });
});

app.post("/create-order", async (req, res) => {
  const { name, mobileNumber, amount, userId, eventId } = req.body;
  const orderId = uuidv4();

  // Payment
  const paymentPayload = {
    merchantId: MERCHANT_ID,
    merchantUserId: name,
    mobileNumber: mobileNumber,
    amount: amount * 100,
    merchantTransactionId: orderId,
    redirectUrl: `${redirectUrl}/?id=${orderId}&userId=${userId}&eventId=${eventId}`,
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
    console.log(response.data.data.instrumentResponse.redirectInfo.url);
    res.status(200).json({
      msg: "OK",
      url: response.data.data.instrumentResponse.redirectInfo.url,
    });
  } catch (error) {
    console.error("Error in payment:", error);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

app.post("/status", async (req, res) => {
  const merchantTransactionId = req.query.id;
  const userId = req.query.userId;
  const eventId = req.query.eventId;

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

    if (response.data.success === true) {
      // Update the user's registered events if payment is successful
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId }, // Find user by userId
        { $push: { registeredEvents: eventId } }, // Add eventId to registeredEvents array
        { new: true } // Return the updated user document
      );

      // Prepare data for QR code
      const qrCodeData = {
        name: updatedUser.name,
        branch: updatedUser.branch,
        registrationNumber: updatedUser.registrationNumber,
        eventId: eventId,
      };

      // Call the send-qr-code API to send the QR code to the user
      const qrCodeResponse = await axios.post(`${LOCAL_HOST}/send-qr-code`, {
        data: qrCodeData,
        receiverEmail: updatedUser.email, // Assuming user's email is stored in the user document
      });

      // Check if QR code was successfully sent
      if (qrCodeResponse.status === 200) {
        return res.status(200).json({
          message: "Payment successful and QR code sent",
          user: updatedUser, // Return the updated user
          redirectUrl: "/success-page", // You can adjust the redirect URL as needed
        });
      } else {
        return res.status(500).json({ message: "QR code sending failed" });
      }
    } else {
      return res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.error("Error during payment status check:", error);
    return res.status(500).json({ message: "Payment status check failed" });
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
