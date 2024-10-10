const webPush = require("web-push");
const Notification = require("../database/notificationModel.js");
const catchAsync = require("../utility/catchAsync.js");
const AppError = require("../utility/AppError.js");

const publicVapidKey =
  "BO64nFLjYDrOH1GvwXftIEEroUpihOost6Rcutdw1O-rqTDIFgS2sZwNTApxSAYFZ_JaIeS2Ul75qXhuhhzq3ao";
const privateVapidKey = "P-SLRT-rJqQBLeXdL1glzwclnHWzHxzW8NN5OhSi5yM";

webPush.setVapidDetails(
  "mailto:debashishmeher955@gmail.com",
  publicVapidKey,
  privateVapidKey
);

exports.createNotification = catchAsync(async (req, res) => {
  const suscription = req.body;
  const user = req.user;

  const usernotification = await Notification.findOne({ user: user.id });
  if (usernotification) {
    usernotification.notification = suscription;
    await usernotification.save();
  } else {
    const notification = new Notification({
      user: user.id,
      notification: suscription,
      role: user.role,
    });
    await notification.save();
  }
  res.status(201).json({
    status: "success",
    message: "sending notification",
  });
});

exports.sendNotificaṭion = (notifydata) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user.id;
    const payload = JSON.stringify(notifydata);
    const adminNotify = await Notification.findOne({ role: "admin" });
    webPush.sendNotification(adminNotify.notification, payload).catch((err) => {
      console.log(err);
    });
    const notify = await Notification.find({ user: user });
    for (let i = 0; i < notify.length; i++) {
      const el = notify[i];
      webPush.sendNotification(el.notification, payload).catch((err) => {
        console.log(err);
      });
    }
    console.log("notify", notify);
  });
};
