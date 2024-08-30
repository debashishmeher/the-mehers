const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  enquary: {
    type: mongoose.Schema.ObjectId,
      ref: "Enquary",
      required: [true, "enquary must be required"],
  },
  method: {
    type: String,
    enum: ["call", "message", "email"],
    required: [true, "method must be required"],
  },
  message: {
    type: String,
  },
  scheduleDate: {
    type: Date,
    default: Date.now(),
  },
});

const Schedule= mongoose.model("Schedule", scheduleSchema);
module.exports = Schedule;
