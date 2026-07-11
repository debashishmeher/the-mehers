const User = require("../database/userModel.js");

const catchAsync = require("../utils/catchAsync.js");
const { sanitize } = require("../utils/sanitizeData.js");
const AppError = require("../utils/AppError.js");
const Enquary = require("../database/enquaryModel.js");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Helper function to delete old user photo from storage
const deleteOldPhoto = (photoPath) => {
  if (!photoPath) return;
  if (photoPath.startsWith("/Image/")) {
    const filename = photoPath.replace("/Image/", "");
    const fullPath = path.join(__dirname, "../Image", filename);
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.log(`Failed to delete old photo at ${fullPath}:`, err.message);
      }
    });
  }
};

// 1. Multer Configuration (Memory storage for sharp processing)
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB file limit
});

exports.uploadUserPhoto = upload.single("photo");

// 2. Sharp Photo Resizing Middleware
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Create standard unique file name
  const filename = `user-${req.auth}-${Date.now()}.jpeg`;
  req.file.filename = filename;

  const uploadDir = path.join(__dirname, "../Image");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);

  // Resize and compress
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(filePath);

  // Set the photo file route path on req.body for DB operations
  const baseUrl = process.env.URL ? (process.env.URL.endsWith("/") ? process.env.URL : `${process.env.URL}/`) : "http://localhost:8000/";
  req.body.photo = `${baseUrl}Image/${filename}`;

  next();
});



exports.editme = catchAsync(async (req, res, next) => {
  const authId = req.auth;

  if (!authId) {
    return next(new AppError("Unauthorized access", 401));
  }

  const cleanData = sanitize(req.body, [
    "f_name",
    "l_name",
    "phone",
    "photo",
  ]);

  const existingUser = await User.findOne({ auth: authId });

  // Delete old photo if a new one is uploaded
  if (existingUser && req.body.photo && existingUser.photo !== req.body.photo) {
    deleteOldPhoto(existingUser.photo);
  }

  // Handle explicit removal of profile picture
  if (req.body.photo === 'remove' || req.body.photo === '') {
    cleanData.photo = '';
    if (existingUser && existingUser.photo) {
      deleteOldPhoto(existingUser.photo);
    }
  }

  const update = await User.findOneAndUpdate({ auth: authId }, cleanData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: update,
  });
});




exports.getMyLeads = catchAsync(async (req, res, next) => {
  const authId = req.auth;

  if (!authId) {
    return next(new AppError("Unauthorized access", 401));
  }

  // Find all leads for this user/auth, populate form details, and sort by newest first
  const leads = await Enquary.find({ auth: authId })
    .populate("form", "title")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: leads.length,
    data: { leads }
  });
});

exports.deleteLead = catchAsync(async (req, res, next) => {
  const authId = req.auth;
  const { id } = req.params;

  if (!authId) {
    return next(new AppError("Unauthorized access", 401));
  }

  if (!id) {
    return next(new AppError("Lead ID is required", 400));
  }

  const deletedLead = await Enquary.findOneAndDelete({ _id: id, auth: authId });

  if (!deletedLead) {
    return next(new AppError("Lead not found or unauthorized", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Lead deleted successfully"
  });
});

exports.getalluser = catchAsync(async (req, res, next) => {
  const newuser = await User.find();

  res.status(200).json({
    status: "success",
    newuser,
  });
});

exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  if (!role || !["admin", "seller", "user"].includes(role)) {
    return next(new AppError("Please provide a valid role (admin, seller, user)", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User role updated successfully",
    data: {
      user
    }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.userId);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User deleted successfully"
  });
});