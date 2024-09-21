const User = require("../database/userModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/AppError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { log } = require("console");
const sendEmail = require("../utility/email");
const crypto = require("crypto");

const signtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY);
};

const createTokenAndSend = (user, statuscode, res) => {
  const token = signtoken(user._id);
  res.cookie("token",token,{expires: new Date(Date.now() + 5259600000), httpOnly: true })
  console.log(user);
  
  res.status(statuscode).json({
    status: "success",
    token,
    user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  if(req.body.role=="admin"){
    const admin= await User.findOne({role:"admin"})
    if(admin){
      return next(new AppError("admin already exist...",404))
    }
  }
  const user = await User.create(req.body);
createTokenAndSend(user,201,res)
});

exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return next(new AppError("please provide email and password"), 404);
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError("invalid user and password"), 404);
  }
  createTokenAndSend(user,200,res)
});


// is login middle-ware
exports.isLogin = async (req, res, next) => {
  
  try {
    if (req.cookies.token) {
      const token = req.cookies.token;
      const decode = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET_KEY
      );
      const currentuser = await User.findById(decode.id);
      if (!currentuser) {
        return next();
      }
      if (currentuser.changepasswordAfter(jwt.iat)) {
        return next();
      }
      res.locals.user = currentuser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.protect = async (req, res, next) => {
  
  let token;
  if(req.cookies.token){
    token=req.cookies.token
  }

  if (!token) {
    return next(new AppError("you are not login plaease log in", 404));
  }
  
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
  const currentUser = await User.findOne({ _id: decode.id });

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
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("there no user in this email address", 404));
  }

  // create rendom token
  const resetToken = user.createRendomToken();
  await user.save({ validateBeforeSave: false });
  // sending token to user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/resetpassword/${resetToken}`;
  const message = `if you are forgot your password please go to this link ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "your password reset",
      message,
    });

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

exports.resetpassword = catchAsync(async (req, res, next) => {
  const getToken = req.params.resetToken;
  console.log(getToken);

  const hashedToken = crypto
    .createHash("sha256")
    .update(getToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    resetTokenExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new AppError("token invalid", 400));
  }

  user.password = req.body.password;
  user.confirmpassword = req.body.confirmpassword;
  user.passwordResetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  // create token and send
  createTokenAndSend(user, 201, res);

});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!user.checkPassword(req.body.currentPassword, user.password)) {
    return next(new AppError("incorrect password", 404));
  }

  user.password = req.body.password;
  user.confirmpassword = req.body.confirmpassword;
  await user.save();
  createTokenAndSend(user, 201, res);
});
