const Admin = require("../database/adminModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/AppError");
const multer = require("multer");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");


const signtoken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY);
};

const createTokenAndSend = (user, statuscode, res) => {
    const token = signtoken(user._id);
    res.cookie("authToken", `Bearer ${token}`, { expires: new Date(Date.now() + 5259600000), httpOnly: false })
    res.status(statuscode).json({
        status: "success",
        token: `Bearer ${token}`,
        user,
    });
};


// ✅ Multer Setup
const multerstorage = multer.memoryStorage();

const multerfilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new AppError("Not an image! please upload only images.", 400), false);
    }
};

// ✅ Upload photo middleware
exports.adminPhoto = adminUpload.single("photo");

// ✅ Resize & Save photo middleware
exports.processAdminImg = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.body.photo = `admin-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`./public/image/admin/${req.body.photo}`);

    next();
});



// ✅ Get All Admins
exports.getAllAdmins = catchAsync(async (req, res, next) => {
    const admins = await Admin.find();

    res.status(200).json({
        status: "success",
        total: admins.length,
        admins,
    });
});

// signup
exports.signup = catchAsync(async (req, res, next) => {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || !confirmPassword) {
        return next(new AppError("please provide all fields", 404))
    }

    if (req.body.role == "admin") {
        const admin = await Admin.findOne({ role: "admin" })
        if (admin) {
            return next(new AppError("admin already exist...", 404))
        }
    }

    const user = await Admin.create(
        {
            name,
            email,
            password,
            confirmPassword,
            phone,
            role: req.body.role ? req.body.role : "team"
        }
    );
    createTokenAndSend(user, 201, res)
});



// login 
exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return next(new AppError("please provide email and password"), 404);
  }

  const user = await Admin.findOne({ email }).select("+password");


  if (!user || !user.password) {
    return next(new AppError("Invalid user and password"), 404);
  }


  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError("invalid user and password"), 404);
  }
  createTokenAndSend(user, 200, res)
});


// is authenticated middleware
exports.isAuthenticated = catchAsync(async (req, res, next) => {
  let token;


  if (req.cookies.authToken) {
    token = req.cookies.authToken.split(" ")[1];
  } else if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("you are not login plaease log in", 404));
  }


  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

  const currentUser = await Admin.findOne({ _id: decode.id });

  if (!currentUser) {
    return next(new AppError("user not exists", 404));
  }

  if (currentUser.changepasswordAfter(decode.iat)) {
    return next(new AppError("password change after token issued", 404));
  }

  req.user = currentUser;

  res.status(200).json({
    isAuthenticated: true,
    status: "success",
    user: currentUser
  })

})

exports.setPassword = catchAsync(async (req, res, next) => {

  const { password, confirmPassword } = req.body;
  const currentUser = req.user;
  console.log(currentUser);


  if (!password || !confirmPassword) {
    return next(new AppError("please provide password and confirm password", 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError("password and confirm password not match", 400));
  }


  currentUser.password = password;
  currentUser.confirmPassword = confirmPassword;
  await currentUser.save();

  createTokenAndSend(currentUser, 200, res);
});


exports.protect = async (req, res, next) => {
  let token;

  // 1. Get token from cookies
  if (req.cookies.authToken) {
    token = req.cookies.authToken.split(" ")[1];
  } else if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("you are not login plaease log in", 404));
  }

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

  const currentUser = await Admin.findOne({ _id: decode.id });

  if (!currentUser) {
    return next(new AppError("user not exists", 404));
  }

  if (currentUser.changepasswordAfter(decode.iat)) {
    return next(new AppError("password change after token issued", 404));
  }

  req.user = currentUser;

  next();
};

exports.accessTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("you don't have permission to access", 404));
    }
    next();
  };
};


exports.forgetpassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const user = await Admin.findOne({ email });

  if (!user) {
    return next(new AppError("there no user in this email address", 404));
  }

  // create rendom token

  const resetToken = user.createRendomToken();
  await user.save({ validateBeforeSave: false });
  // sending token to user email
  const resetURL = `http://localhost:5173/resetpassword/${resetToken}`;
  const message = `if you are forgot your password please go to this link ${resetURL}`;

  try {
    await new sendEmail(user, resetURL).resetPassword();

    res.status(200).json({
      status: "success",
      message: "token send to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("sothing went wrong to send email", 500));
  }
});





// ✅ Get Single Admin
exports.getAdminById = catchAsync(async (req, res, next) => {
    const admin = await Admin.findById(req.params.id);

    if (!admin) return next(new AppError("Admin not found", 404));

    res.status(200).json({
        status: "success",
        admin,
    });
});



const adminUpload = multer({
    storage: multerstorage,
    fileFilter: multerfilter,
});



// ✅ Update Admin (Logged in admin)
exports.updateAdmin = catchAsync(async (req, res, next) => {
    const adminId = req.user.id;

    // prevent password update from here
    if (req.body.password || req.body.confirmPassword) {
        return next(new AppError("This route is not for password updates", 400));
    }

    const admin = await Admin.findByIdAndUpdate(adminId, req.body, {
        new: true,
        runValidators: true,
    });

    if (!admin) return next(new AppError("Admin not found", 404));

    res.status(200).json({
        status: "success",
        message: "Admin updated successfully",
        admin,
    });
});

// ✅ Delete Admin
exports.deleteAdmin = catchAsync(async (req, res, next) => {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) return next(new AppError("Admin not found", 404));

    res.status(200).json({
        status: "success",
        message: "Admin deleted successfully",
    });
});
