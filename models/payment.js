// models/Payment.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["success", "failure"],
      required: true,
    },
    transactionId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
