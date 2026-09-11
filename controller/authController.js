const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const { setCache, getCache, delCache } = require("../utils/cache");
const emailQueue = require("../queues/emailQueue");
const AppError = require("../utils/AppError");
const Auth = require("../database/authModel");
const User = require("../database/userModel");
const RefreshToken = require("../database/refreshTokenModel");
const { generateAccessToken } = require("../utils/jwt");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.sendOtp = catchAsync(async (req, res, next) => {

    const { email } = req.body;


    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex"); // Hash the OTP

    await setCache(`OTP:${email}`, hashedOtp, 10 * 60); // Set the OTP in cache with a 10-minute expiry

    const job = await emailQueue.add(
        "send-otp",
        {
            type: "OTP",
            payload: {
                user: { email },
                otp,
            },
        },
        {
            attempts: 3, // retry 3 times
            backoff: {
                type: "exponential",
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        }
    );

    res.status(200).json({
        status: "success",
        message: "OTP sent to your email",
        email,
    });

});

exports.verifyOtp = catchAsync(async (req, res, next) => {
    const { email, otp } = req.body;

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const cachedOtp = await getCache(`OTP:${email}`);

    if (!cachedOtp) {
        return next(new AppError("Invalid or expired OTP", 400));
    }


    if (hashedOtp !== cachedOtp) {
        return next(new AppError("Invalid OTP", 400));
    }

    await delCache(`OTP:${email}`);

    req.email = email;

    return next();
});

exports.createAuth = catchAsync(async (req, res, next) => {
    const { email } = req;

    try {
        if (!email) {
            return next(new AppError("Email is required", 400));
        }

        // 1️⃣ UPSERT AUTH
        const auth = await Auth.findOneAndUpdate(
            { email },
            {
                $set: { email_verified: true },
                $setOnInsert: { email },
            },
            {
                returnDocument: "after",
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        // 2️⃣ CREATE REFRESH TOKEN
        const tokenDoc = new RefreshToken({
            userId: auth._id,
            userAgent: req.headers["user-agent"],
            ip: req.ip,
        });

        const refreshToken = tokenDoc.generateToken();

        const tokens = await RefreshToken.find({ userId: auth._id })
            .sort({ createdAt: -1 }) // newest first
            .skip(3); // skip latest 3, get older ones

        if (tokens.length > 0) {
            await RefreshToken.deleteMany({
                _id: { $in: tokens.map(t => t._id) },
            });
        }

        await tokenDoc.save();

        // 3 ACCESS TOKEN
        const accessToken = generateAccessToken(auth);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        };

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 90 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            status: "success",
            accessToken,
            refreshToken
        });

    } catch (err) {
        next(err);
    }
});

exports.refreshToken = catchAsync(async (req, res, next) => {
    const incomingToken =
        req.cookies.refreshToken || req.headers["x-refresh-token"];

    if (!incomingToken) {
        return next(new AppError("No refresh token provided", 401));
    }
    // 1️⃣ Hash incoming token
    const hashedToken = crypto
        .createHash("sha256")
        .update(incomingToken)
        .digest("hex");

    // 2️⃣ Find token (do NOT filter isRevoked yet → needed for reuse detection)
    const cacheKey = `refreshToken:${hashedToken}`;
    let storedToken = await getCache(cacheKey);

    if (!storedToken) {
        storedToken = await RefreshToken.findOne({ token: hashedToken });
        if (storedToken) {
            const remainingSeconds = Math.max(0, Math.floor((new Date(storedToken.expiresAt) - new Date()) / 1000));
            if (remainingSeconds > 0) {
                await setCache(cacheKey, storedToken, remainingSeconds);
            }
        }
    }

    if (!storedToken) {
        return next(new AppError("Invalid refresh token", 401));
    }

    // 🔥 3️⃣ REUSE DETECTION
    if (storedToken.isRevoked) {
        await RefreshToken.updateMany(
            { userId: storedToken.userId, isRevoked: false },
            { isRevoked: true }
        );
        await delCache(cacheKey);

        return next(new AppError("Token reuse detected. All sessions revoked.", 401));
    }

    // 4️⃣ Expiry check
    if (new Date(storedToken.expiresAt) < new Date()) {
        return next(new AppError("Refresh token expired", 401));
    }

    // 5️⃣ Revoke old token (rotation)
    await RefreshToken.updateOne({ _id: storedToken._id }, { isRevoked: true });
    await delCache(cacheKey);

    // 6️⃣ Create new refresh token (MODEL METHOD)
    const tokenDoc = new RefreshToken({
        userId: storedToken.userId,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });

    const rawRefreshToken = tokenDoc.generateToken(); // should hash internally

    // 🔥 Optional: single session (enable if you want only 1 device)
    // await RefreshToken.deleteMany({ userId: storedToken.userId });

    await tokenDoc.save();
    await tokenDoc.populate("userId");

    // 7️⃣ Generate access token
    const accessToken = generateAccessToken(tokenDoc.userId);

    // 8️⃣ Cookies
    res.cookie("refreshToken", rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    // (optional) you can avoid storing accessToken in cookie
    res.status(200).json({
        status: "success",
        accessToken,
        refreshToken: rawRefreshToken,
    });
});
exports.logout = catchAsync(async (req, res, next) => {
    const incomingToken =
        req.cookies.refreshToken || req.headers["x-refresh-token"];
    if (!incomingToken) {
        return next(new AppError("No refresh token provided", 401));
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(incomingToken)
        .digest("hex");

    await RefreshToken.findOneAndUpdate({ token: hashedToken }, { isRevoked: true });

    // Invalidate refresh token cache
    await delCache(`refreshToken:${hashedToken}`);

    // Invalidate access token cache if sent in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
        await delCache(`accessToken:${token}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
});


exports.protect = catchAsync(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return next(new AppError("Unauthorized", 401));
    }
    try {
        const cacheKey = `accessToken:${token}`;
        let decoded = await getCache(cacheKey);

        if (!decoded) {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
            if (remainingTime > 0) {
                await setCache(cacheKey, decoded, remainingTime);
            }
        }

        req.auth = decoded.sub;
        req.role = decoded.role;
        req.user = { id: decoded.sub, _id: decoded.sub };

        next();
    } catch (err) {
        return next(new AppError("Invalid or expired token", 401));
    }
})



exports.tryProtect = catchAsync(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (token) {
        try {
            const cacheKey = `accessToken:${token}`;
            let decoded = await getCache(cacheKey);

            if (!decoded) {
                decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
                if (remainingTime > 0) {
                    await setCache(cacheKey, decoded, remainingTime);
                }
            }
            req.auth = decoded.sub;
            req.role = decoded.role;
            req.user = { id: decoded.sub, _id: decoded.sub };
        } catch (err) {
            // Ignore error for optional authentication
        }
    }
    next();
});



exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.role)) {
            return next(new AppError("You are not authorized to perform this action", 403));
        }
        next();
    };
};

exports.accessTo = exports.restrictTo;


exports.googleAuth = catchAsync(async (req, res, next) => {

    const token = req.body.token || req.body.credential;

    if (!token) {
        return next(new AppError("No Google token provided", 400));
    }

    // 1️⃣ Verify token with Google
    const allowedAudiences = Array.from(
        new Set(
            [
                process.env.GOOGLE_CLIENT_ID,
                process.env.CLIENT_ID,
                "310944655232-8utaq454rbjqtpdog4cbh5pb5kqmug7l.apps.googleusercontent.com",
                "739285210301-3dqhr5pk38gpr1nb0vjad3lv316feh1j.apps.googleusercontent.com",
            ]
                .filter(Boolean)
                .map((id) => id.replace(/^["']|["']$/g, "").trim())
        )
    );

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: allowedAudiences,
    });

    const payload = ticket.getPayload();

    const {
        sub: googleId,
        email,
        name,
        picture,
        email_verified,
    } = payload;

    if (!email_verified) {
        return next(new AppError("Google email not verified", 401));
    }

    // 2️⃣ Check if user exists
    const auth = await Auth.findOneAndUpdate(
        { email },
        {
            $set: {
                email_verified: true,
                provider: "google",
                googleId

            },
            $setOnInsert: { email, googleAuthAt: new Date(), },
        },
        {
            returnDocument: "after",
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    // Auto-create User profile if not already present
    const existingUser = await User.findOne({ auth: auth._id });
    if (!existingUser) {
        let f_name = "User";
        let l_name = "Account";
        if (name && typeof name === "string") {
            const parts = name.trim().split(/\s+/);
            f_name = parts[0] || "User";
            l_name = parts.slice(1).join(" ") || parts[0] || "User";
        }
        await User.create({
            auth: auth._id,
            email: auth.email,
            f_name,
            l_name,
            photo: picture || "",
        }).catch((err) => {
            console.error("Auto-creating user on Google login:", err.message);
        });
    }

    // 2️⃣ CREATE REFRESH TOKEN
    const tokenDoc = new RefreshToken({
        userId: auth._id,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });

    const rawRefreshToken = tokenDoc.generateToken();

    // 🔥 single session (optional)
    await RefreshToken.deleteMany({ userId: auth._id });

    await tokenDoc.save();

    // 3️⃣ ACCESS TOKEN
    const accessToken = generateAccessToken(auth);

    // 4️⃣ COOKIES
    const googleCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    res.cookie("accessToken", accessToken, {
        ...googleCookieOptions,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", rawRefreshToken, {
        ...googleCookieOptions,
        maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        status: "success",
        accessToken,
        refreshToken: rawRefreshToken,
    });
});

exports.completeOnboarding = catchAsync(async (req, res, next) => {
    const auth = await Auth.findByIdAndUpdate(
        req.auth,
        { onboarded: true },
        { returnDocument: "after", runValidators: true }
    );

    if (!auth) {
        return next(new AppError("User not found", 404));
    }

    res.status(200).json({
        status: "success",
        message: "Onboarding completed successfully",
        data: {
            onboarded: auth.onboarded
        }
    });
});


