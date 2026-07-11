const mongoose = require("mongoose");
const crypto = require("crypto");

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    userAgent: {
        type: String,
        default: "Unknown Device",
    },
    ip: {
        type: String,
        default: "Unknown IP",
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

// Method to generate a secure raw refresh token and store its SHA-256 hash
refreshTokenSchema.methods.generateToken = function () {
    const rawToken = crypto.randomBytes(40).toString("hex");
    
    // Hash and store the token
    this.token = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
        
    // Set default expiration to 30 days
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    return rawToken;
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;
