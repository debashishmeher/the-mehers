const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../config.env") });

// mongodb files require
import("../database/connection.js");

const { connectRedis } = require("../config/redis.js");
connectRedis().catch((err) => console.error("Redis connection failed:", err.message));

// REQUIREING module
const globalErrorHandelling = require("../controller/globalErrorHandeling.js");
const AppError = require("../utils/AppError.js");
const cookieParser = require("cookie-parser");
const webPush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors")


// middleware
const userRouter = require("../router/userRouter.js");

const productRouter = require("../router/productRouter.js");
const orderrderRouter = require("../router/orderRouter.js");
const blogRouter = require("../router/blogRouter.js")
const enquaryRouter = require("../router/enquaryRouter.js")
const categoryRouter = require("../router/categoryRouter.js");
const contentRouter = require("../router/contentRouter.js");
const authRouter = require("../router/authRouter.js");
const Notification = require("../database/notificationModel.js");
const catchAsync = require("../utils/catchAsync.js");
const notificationController = require("../controller/notificationController.js")
const authController = require("../controller/authController.js")
const storeRouter = require("../router/storeRouter.js")

const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// 1. Secure HTTP headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

app.use(
    cors({
        origin: ["https://themehers.in", "https://admin.themehers.in", "https://www.themehers.in"],
        credentials: true,
    })
);

// 2. Request body parsing
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. NoSQL Injection Sanitization for Auth Fields
const sanitizeAuthBody = (req, res, next) => {
    if (req.body) {
        const fieldsToSanitize = ["email", "token"];
        fieldsToSanitize.forEach((field) => {
            if (req.body[field] && typeof req.body[field] !== "string") {
                req.body[field] = String(req.body[field]);
            }
        });
    }
    next();
};
app.use(sanitizeAuthBody);




app.use(express.static(path.join(__dirname, "../public")));
app.use("/Image", express.static(path.join(__dirname, "../Image")));

// router
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/blogs", blogRouter);
app.use("/api/order", orderrderRouter);
app.use("/api/enquiry", enquaryRouter);
app.use("/api/content", contentRouter);
app.use("/api/store", storeRouter)


app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandelling);

app.listen(process.env.PORT, (err) => {
    if (err) {
        console.log(err);
    }
    console.log(`server listening at port no ${process.env.PORT}`);
});