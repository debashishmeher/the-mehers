const Schedule = require("../database/sechduleModel");
const catchAsync = require("../utility/catchAsync");

// create enquary----------------------------
exports.createSchedule = catchAsync(async (req, res, next) => {
  if (!req.body.enquary) req.body.enquary = req.params.enquaryId;
  const schedule = await Schedule.create(req.body);
  res.status(201).json({
    status: "success",
    message: "enquary successful",
    schedule,
  });
});

// update one enquary
exports.deleteSchedule = catchAsync(async (req, res, next) => {
  await Schedule.findByIdAndDelete(req.params.enquaryId);
  res.status(201).json({
    status: "success",
    message: "enquary update successfully",
  });
});
