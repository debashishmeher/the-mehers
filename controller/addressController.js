const Address = require("../database/addressModel");
const catchAsync = require("../utils/catchAsync");

exports.createAddress = catchAsync(async (req, res) => {
  const address = await Address.create({
    ...req.body,
    user: req.user.id,
  });

  res.status(201).json({
    status: "success",
    message: "address created successfully",
    data: {
      address,
    },
  });
});

exports.getUserAddress = catchAsync(async (req, res) => {
  const addresses = await Address.find({ user: req.user.id });

  res.status(200).json({
    status: "success",
    data: {
      addresses,
      totalAddresses: addresses.length,
    },
  });
});

exports.updateUserAddress = catchAsync(async (req, res) => {
  const address = await Address.findOneAndUpdate({ user: req.user.id }, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "address updated successfully",
    data: {
      address,
    },
  });
});

exports.deleteUserAddress = catchAsync(async (req, res) => {
  await Address.findOneAndDelete({ user: req.user.id });

  res.status(200).json({
    status: "success",
    message: "address deleted successfully",
  });
});
