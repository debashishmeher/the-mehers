const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    required: [true, "user must be required"],
  },
  notification: {
    type: Object,
    required: [true, "notification subscription needed.."],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  role:{
    type:String,
    enum:["user","admin"],
    default:"user"
  }
});


notificationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
  });
  next();
});


const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
