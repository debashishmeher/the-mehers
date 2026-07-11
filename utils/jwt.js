const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user._id,
            role: user.role
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );
}

function generateRefreshToken() {

    const refreshToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    return hashedToken;
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
};
