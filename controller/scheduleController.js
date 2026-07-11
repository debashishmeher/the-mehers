const Schedule = require("../database/sechduleModel");
const catchAsync = require("../utils/catchAsync");

exports.createSchedule = catchAsync(async (req, res) => {
  const schedule = await Schedule.create({
    ...req.body,
    enquary: req.body.enquary || req.params.enquaryId,
  });

  res.status(201).json({
    status: "success",
    message: "schedule created successfully",
    data: {
      schedule,
    },
  });
});

exports.deleteSchedule = catchAsync(async (req, res) => {
  let result;

  if (req.params.scheduleId) {
    result = await Schedule.findByIdAndDelete(req.params.scheduleId);
  } else {
    result = await Schedule.deleteMany({ enquary: req.params.enquaryId });
  }

  res.status(200).json({
    status: "success",
    message: "schedule deleted successfully",
    data: {
      result,
    },
  });
});
