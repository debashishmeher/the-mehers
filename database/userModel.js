const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please provide name"],
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "please provide a valid email"],
    unique: true,
  },
  role: {
    type: String,
    enum: ["admin", "seller", "user"],
    default: "user",
  },
  photo: {
    type:String,
    default:"default-user.png"
  },
  password: {
    type: String,
    minlength: 8,
    required: [true, "password must be required"],
    select: false,
  },
  confirmpassword: {
    type: String,
    required: [true, "please provide password"],
    minlength: 8,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "password and confirm password are not match",
    },
  },
  updatepassword: Date,
  passwordResetToken: String,
  resetTokenExpire: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmpassword = undefined;
  next();
});
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  this.updatepassword = Date.now() - 1000;
  next();
});

userSchema.methods.checkPassword = async (inputpass, orgpass) => {
  return await bcrypt.compare(inputpass, orgpass);
};

// check update password
userSchema.methods.changepasswordAfter = function (jwtTimeStamp) {
  if (this.updatepassword) {
    const changedTime = parseInt(this.updatepassword.getTime() / 1000, 10);

    return jwtTimeStamp < changedTime;
  }
  return false;
};

userSchema.methods.createRendomToken = function () {
  const resetToken = crypto.pseudoRandomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetTokenExpire = Date.now() + 10 * 60 * 1000;

  console.log(this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
