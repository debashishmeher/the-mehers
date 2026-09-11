const Address = require("../database/addressModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const getUserId = (req) => req.user?.id || req.user?._id || req.auth;

exports.createAddress = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) return next(new AppError("Unauthorized", 401));

  const count = await Address.countDocuments({ user: userId });
  if (count >= 5) {
    return next(new AppError("You can only save up to 5 addresses.", 400));
  }

  const address = await Address.create({
    ...req.body,
    user: userId,
  });

  res.status(201).json({
    status: "success",
    message: "address created successfully",
    data: {
      address,
    },
  });
});

exports.getUserAddress = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) return next(new AppError("Unauthorized", 401));

  const addresses = await Address.find({ user: userId });

  res.status(200).json({
    status: "success",
    data: {
      addresses,
      totalAddresses: addresses.length,
    },
  });
});

exports.updateUserAddress = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) return next(new AppError("Unauthorized", 401));

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!address) {
    return next(new AppError("No address found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "address updated successfully",
    data: {
      address,
    },
  });
});

exports.deleteUserAddress = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) return next(new AppError("Unauthorized", 401));

  const address = await Address.findOneAndDelete({ _id: req.params.id, user: userId });

  if (!address) {
    return next(new AppError("No address found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "address deleted successfully",
  });
});
