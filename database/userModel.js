const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    f_name: {
        type: String,
        required: [true, "please provide first name"],
    },
    l_name: {
        type: String,
        required: [true, "please provide last name"],
    },
    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, "please provide a valid email"],
        unique: true,
    },
    phone: {
        type: String,
        validate: {
            validator: function (el) {
                // Indian Mobile Number Validation
                return /^[6-9]\d{9}$/.test(el);
            },
            message: "Please provide a valid 10-digit Indian mobile number",
        },
    },
    photo: {
        type: String,
    },
    auth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true,
    }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
