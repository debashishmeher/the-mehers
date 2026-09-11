const User = require("../database/userModel.js");
const authController = require("./authController.js");
const catchAsync = require("../utils/catchAsync.js");
const { sanitize } = require("../utils/sanitizeData.js");
const AppError = require("../utils/AppError.js");
const Auth = require("../database/authModel.js");
const RefreshToken = require("../database/refreshTokenModel.js");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { delCache } = require("../utils/cache.js");
const emailQueue = require("../queues/emailQueue.js");

const deleteOldPhoto = (photoPath) => {
  if (!photoPath) return;
  let filename = "";
  if (photoPath.includes("/Image/")) {
    filename = photoPath.substring(photoPath.indexOf("/Image/") + 7);
  }
  if (filename) {
    const fullPath = path.join(__dirname, "../Image", filename);
    fs.unlink(fullPath, () => {});
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
  req.body.photo = `${process.env.API_URL}/Image/${filename}`;

  next();
});

exports.createUser = catchAsync(async (req, res, next) => {
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

  cleanData.auth = authId;
  const authclient = await Auth.findById(authId);
  if (!authclient) {
    return next(new AppError("Unauthorized access", 401));
  }
  cleanData.email = authclient.email;

  const user = await User.create(cleanData);

  // Queue welcome email
  await emailQueue.add(
    "send-welcome",
    {
      type: "WELCOME",
      payload: {
        user: {
          email: user.email,
          f_name: user.f_name,
          l_name: user.l_name,
        },
      },
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  ).catch((err) => {
    console.error("Failed to queue welcome email:", err.message);
  });

  res.status(201).json({
    status: "success",
    data: { user },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const authId = req.auth;

  if (!authId) {
    return next(new AppError("Unauthorized access", 401));
  }

  const user = await User.findOne({ auth: authId }).select("-__v");
  const auth = await Auth.findById(authId).select("-__v");

  if (!auth) {
    return next(new AppError("Auth record not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: user || null,
      auth: {
        email: auth.email,
        role: auth.role,
        onboarded: auth.onboarded,

      },
    },
  });
});

exports.editme = catchAsync(async (req, res, next) => {
  const authId = req.auth;

  if (!authId) {
    return next(new AppError("Unauthorized access", 401));
  }

  if (req.body.name && typeof req.body.name === "string" && !req.body.f_name) {
    const parts = req.body.name.trim().split(/\s+/);
    req.body.f_name = parts[0] || "";
    req.body.l_name = parts.slice(1).join(" ") || "";
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

  let update;
  if (existingUser) {
    update = await User.findOneAndUpdate({ auth: authId }, cleanData, {
      returnDocument: "after",
      runValidators: true,
    });
  } else {
    const authclient = await Auth.findById(authId);
    cleanData.auth = authId;
    if (authclient) cleanData.email = authclient.email;
    update = await User.create(cleanData);
  }

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: update,
  });
});

exports.getActiveSessions = catchAsync(async (req, res, next) => {
  const authId = req.auth;
  if (!authId) {
    return next(new AppError("Unauthorized access", 401));
  }

  // Find all active tokens for the user
  const activeTokens = await RefreshToken.find({
    userId: authId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  // Get current session token to identify "current device"
  const incomingToken = req.cookies.refreshToken || req.headers["x-refresh-token"];
  let currentHashedToken = "";
  if (incomingToken) {
    currentHashedToken = crypto
      .createHash("sha256")
      .update(incomingToken)
      .digest("hex");
  }

  const sessions = activeTokens.map((tokenDoc) => {
    return {
      _id: tokenDoc._id,
      userAgent: tokenDoc.userAgent || "Unknown Device",
      ip: tokenDoc.ip || "Unknown IP",
      createdAt: tokenDoc.createdAt,
      isCurrent: tokenDoc.token === currentHashedToken
    };
  });

  res.status(200).json({
    status: "success",
    data: { sessions }
  });
});

exports.revokeSession = catchAsync(async (req, res, next) => {
  const authId = req.auth;
  const { id } = req.params;

  if (!authId) {
    return next(new AppError("Unauthorized access", 401));
  }

  if (!id) {
    return next(new AppError("Session ID is required", 400));
  }

  // Revoke the session by marking it as revoked
  const tokenDoc = await RefreshToken.findOneAndUpdate(
    { _id: id, userId: authId },
    { isRevoked: true },
    { returnDocument: "after" }
  );

  if (!tokenDoc) {
    return next(new AppError("Session not found or already revoked", 404));
  }

  // Invalidate cached refresh token
  await delCache(`refreshToken:${tokenDoc.token}`);

  res.status(200).json({
    status: "success",
    message: "Session revoked successfully"
  });
});