const mongoose = require("mongoose");
const crypto = require("crypto");

const refreshTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            index: true, // 🔥 fast lookup
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Auth",
            required: true,
            index: true,
        },

        expiresAt: {
            type: Date,
            required: true
        },

        isRevoked: {
            type: Boolean,
            default: false,
            index: true,
        },

        userAgent: String,
        ip: String,
    },
    { timestamps: true }
);


// 🔥 TTL index (auto delete expired tokens)
refreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);


// 🔥 compound index (very useful for queries)
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });


// 🔐 Generate & attach refresh token
refreshTokenSchema.methods.generateToken = function () {
    // ✅ secure random token
    const rawToken = crypto.randomBytes(40).toString("hex");

    // ✅ hash before storing
    this.token = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    // ✅ expiry (7 days recommended, not 90 hours random)
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    return rawToken; // send this to client
};


// 🔍 Static helper to verify token
refreshTokenSchema.statics.findValidToken = async function (rawToken) {
    const hashed = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    return this.findOne({
        token: hashed,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
    });
};


const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;