const mongoose = require("mongoose");
const validator = require("validator");

const authSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, "please provide a valid email"],
        unique: true,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    email_verified: { type: Boolean, default: false },
    googleId: {
        type: String,
        sparse: true,
        index: true,
    },
    googleAuthAt: Date,
    providers: {
        type: [String],
        enum: ["otp", "google"],
        default: ["otp"],
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
    onboarded: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });


const Auth = mongoose.model("Auth", authSchema);

module.exports = Auth;
