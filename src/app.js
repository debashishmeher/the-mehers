const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../config.env") });

// mongodb files require
import("../database/connection.js");

// REQUIREING module
const globalErrorHandelling = require("../controller/globalErrorHandeling.js");
const AppError = require("../utils/AppError.js");
const cookieParser = require("cookie-parser");
const webPush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors")


// middleware
const userRouter = require("../router/userRouter.js");
const viewRouter = require("../router/viewRouter.js");

const productRouter = require("../router/productRouter.js");
const orderrderRouter = require("../router/orderRouter.js");
const blogRouter = require("../router/blogRouter.js")
const cartRouter = require("../router/cartRouter.js");
const enquaryRouter = require("../router/enquaryRouter.js")
const categoryRouter = require("../router/categoryRouter.js");
const contentRouter = require("../router/contentRouter.js");
const Notification = require("../database/notificationModel.js");
const catchAsync = require("../utils/catchAsync.js");
const notificationController = require("../controller/notificationController.js")
const authController = require("../controller/authController.js")

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
    origin: ["http://localhost:5173", "https://admin.themehers.in"],
    credentials: true,
  })
);

// 2. Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. NoSQL Injection Sanitization for Auth Fields
const sanitizeAuthBody = (req, res, next) => {
  if (req.body) {
    const fieldsToSanitize = ["email", "password", "token"];
    fieldsToSanitize.forEach((field) => {
      if (req.body[field] && typeof req.body[field] !== "string") {
        req.body[field] = String(req.body[field]);
      }
    });
  }
  next();
};
app.use(sanitizeAuthBody);

// 4. Rate Limiter for Critical Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  message: {
    status: "fail",
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/user/login", authLimiter);
app.use("/api/user/signup", authLimiter);
app.use("/api/user/forgotpassword", authLimiter);
app.use("/api/user/google-login", authLimiter);

app.use(express.static(path.join(__dirname, "../public")));
app.use("/Image", express.static(path.join(__dirname, "../Image")));

// router

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/blogs", blogRouter);
app.use("/api/order", orderrderRouter);
app.use("/api/cart", cartRouter);
app.use("/api/enquiry", enquaryRouter);
app.use("/api/content", contentRouter);

// push notification............

// const vapidKeys = webPush.generateVAPIDKeys();
// console.log(vapidKeys);

// const publicVapidKey =
//   'BO64nFLjYDrOH1GvwXftIEEroUpihOost6Rcutdw1O-rqTDIFgS2sZwNTApxSAYFZ_JaIeS2Ul75qXhuhhzq3ao';
// const privateVapidKey = 'P-SLRT-rJqQBLeXdL1glzwclnHWzHxzW8NN5OhSi5yM';

// webPush.setVapidDetails("mailto:debashishmeher955@gmail.com",publicVapidKey,privateVapidKey);

// ?routes
app.post("/subscribe", authController.protect, notificationController.createNotification)

app.all("*", (req, res, next) => {
  res.status(404).render("404error")
});

app.use(globalErrorHandelling);

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`server listening at port no ${process.env.PORT}`);
});
