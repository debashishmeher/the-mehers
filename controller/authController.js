const User = require("../database/userModel");
const RefreshToken = require("../database/refreshTokenModel");
const Cart = require('../database/cartModel');
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signtoken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY);
};

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "15m" });
};

const createTokenAndSend = async (user, statuscode, req, res) => {
    const accessToken = generateAccessToken(user._id);
    const bearerAccessToken = `Bearer ${accessToken}`;

    const refreshTokenDoc = new RefreshToken({
        userId: user._id,
        userAgent: req.headers["user-agent"] || "Unknown Device",
        ip: req.ip || "Unknown IP",
    });
    const rawRefreshToken = refreshTokenDoc.generateToken();
    await refreshTokenDoc.save();

    res.cookie("token", bearerAccessToken, {
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.cookie("refreshToken", rawRefreshToken, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.status(statuscode).json({
        status: "success",
        token: bearerAccessToken,
        refreshToken: rawRefreshToken,
        user,
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    if (req.body.role === "admin") {
        const admin = await User.findOne({ role: "admin" });
        if (admin) {
            return next(new AppError("admin already exist...", 404));
        }
    }
    const user = await User.create(req.body);
    await createTokenAndSend(user, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return next(new AppError("please provide email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.checkPassword(password, user.password))) {
        return next(new AppError("invalid user and password", 401));
    }
    await createTokenAndSend(user, 200, req, res);
});

// is login middle-ware
exports.isLogin = async (req, res, next) => {
    try {
        let rawToken = req.cookies.token || req.cookies.authToken;
        if (rawToken && rawToken.startsWith("Bearer")) {
            const token = rawToken.split(" ")[1];
            const decode = await promisify(jwt.verify)(
                token,
                process.env.JWT_SECRET_KEY
            );
            const currentuser = await User.findById(decode.id);
            const cart = await Cart.find({ user: currentuser.id });
            if (!currentuser) {
                return next();
            }
            if (!currentuser.googleId && currentuser.changepasswordAfter(decode.iat)) {
                return next();
            }
            res.locals.cart = cart.length;
            res.locals.user = currentuser;
            return next();
        }
    } catch (err) {
        return next();
    }
    next();
};

exports.protect = async (req, res, next) => {
    let rawToken;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        rawToken = req.headers.authorization;
    } else if (req.cookies && req.cookies.authToken && req.cookies.authToken.startsWith("Bearer")) {
        rawToken = req.cookies.authToken;
    } else if (req.cookies && req.cookies.token && req.cookies.token.startsWith("Bearer")) {
        rawToken = req.cookies.token;
    }

    if (!rawToken) {
        return next(new AppError("You are not logged in. Please log in with a valid Bearer token.", 401));
    }

    const token = rawToken.split(" ")[1];

    try {
        const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
        const currentUser = await User.findOne({ _id: decode.id });

        if (!currentUser) {
            return next(new AppError("user not exists", 404));
        }

        if (!currentUser.googleId && currentUser.changepasswordAfter(decode.iat)) {
            return next(new AppError("password change after token issued", 404));
        }

        req.user = currentUser;
        next();
    } catch (err) {
        return next(new AppError("Invalid or expired token.", 401));
    }
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

    // create random token
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

        return next(new AppError("something went wrong to send email", 500));
    }
});

exports.resetpassword = catchAsync(async (req, res, next) => {
    const getToken = req.params.resetToken;
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

    await createTokenAndSend(user, 201, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    if (!user.checkPassword(req.body.currentPassword, user.password)) {
        return next(new AppError("incorrect password", 404));
    }

    user.password = req.body.password;
    user.confirmpassword = req.body.confirmpassword;
    await user.save();
    await createTokenAndSend(user, 201, req, res);
});

exports.googleLogin = catchAsync(async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return next(new AppError("No Google token provided", 400));
    }

    // 1. Verify Google ID token
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
        return next(new AppError("Invalid Google token payload", 400));
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified) {
        return next(new AppError("Google email not verified", 401));
    }

    // 2. Find user or create
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
        // User exists, link googleId if missing
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save({ validateBeforeSave: false });
        }
        await createTokenAndSend(user, 200, req, res);
    } else {
        // User does not exist, create new user without password fields
        user = await User.create({
            name,
            email,
            photo: picture || "default-user.png",
            googleId,
        });

        await createTokenAndSend(user, 201, req, res);
    }
});

exports.isAuthenticated = catchAsync(async (req, res, next) => {
    if (!req.user) {
        return next(new AppError("Unauthorized access", 401));
    }

    res.status(200).json({
        status: "success",
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            photo: req.user.photo || "default-user.png"
        }
    });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
    const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!rawRefreshToken) {
        return next(new AppError("No refresh token provided", 401));
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(rawRefreshToken)
        .digest("hex");

    const storedToken = await RefreshToken.findOne({ token: hashedToken });

    if (!storedToken) {
        return next(new AppError("Invalid refresh token", 401));
    }

    // --- REUSE DETECTION ---
    if (storedToken.isRevoked) {
        // Revoke all active sessions for this user due to reuse threat
        await RefreshToken.deleteMany({ userId: storedToken.userId });
        return next(new AppError("Security alert: Token reuse detected. All sessions revoked.", 401));
    }

    // Expiry check
    if (storedToken.expiresAt < new Date()) {
        await RefreshToken.deleteOne({ _id: storedToken._id });
        return next(new AppError("Refresh token has expired", 401));
    }

    const user = await User.findById(storedToken.userId);
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    // Invalidate the old refresh token
    storedToken.isRevoked = true;
    await storedToken.save();

    // Issue rotated tokens
    await createTokenAndSend(user, 200, req, res);
});

exports.logout = catchAsync(async (req, res, next) => {
    const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (rawRefreshToken) {
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawRefreshToken)
            .digest("hex");
        await RefreshToken.deleteOne({ token: hashedToken });
    }

    res.clearCookie("token");
    res.clearCookie("refreshToken");

    res.status(200).json({
        status: "success",
        message: "Successfully logged out.",
    });
});

exports.getActiveSessions = catchAsync(async (req, res, next) => {
    const activeTokens = await RefreshToken.find({
        userId: req.user._id,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    const rawRefreshToken = req.cookies.refreshToken;
    let currentHashedToken = "";
    if (rawRefreshToken) {
        currentHashedToken = crypto
            .createHash("sha256")
            .update(rawRefreshToken)
            .digest("hex");
    }

    const sessions = activeTokens.map((tokenDoc) => {
        return {
            _id: tokenDoc._id,
            userAgent: tokenDoc.userAgent || "Unknown Device",
            ip: tokenDoc.ip || "Unknown IP",
            createdAt: tokenDoc.createdAt,
            isCurrent: tokenDoc.token === currentHashedToken,
        };
    });

    res.status(200).json({
        status: "success",
        results: sessions.length,
        data: {
            sessions,
        },
    });
});

exports.revokeSession = catchAsync(async (req, res, next) => {
    const session = await RefreshToken.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });

    if (!session) {
        return next(new AppError("Session not found", 404));
    }

    await RefreshToken.deleteOne({ _id: session._id });

    res.status(200).json({
        status: "success",
        message: "Session successfully revoked.",
    });
});
