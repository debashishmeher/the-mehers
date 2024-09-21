const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "user must be required required"],
  },
  amount: {
    type: Number,
    required: [true, "payment amount must be required"],
  },
  paymentId: {
    type: String,
    required: [true, "payment id must be required"],
  },
  orderId: {
    type: String,
    required: [true, "payment id must be required"],
  },
  paymentSignature: {
    type: String,
    required: [true, "payment id must be required"],
  },
  status: {
    type: String,
    enum: ["verified", "unverified"],
    default: "verified",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
