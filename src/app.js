const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../config.env") });

// mongodb files require
import("../database/connection.js");

// REQUIREING module
const globalErrorHandelling = require("../controller/globalErrorHandeling.js");
const AppError = require("../utility/AppError.js");
const cookieParser = require("cookie-parser");
const webPush = require("web-push");
const bodyParser = require("body-parser");
const pug = require("pug");
const cors=require("cors")
const session=require("express-session")

// middleware
const userRouter = require("../router/userRouter.js");
const viewRouter = require("../router/viewRouter.js");
const adminRouter = require("../router/adminRouter.js");
const productRouter = require("../router/productRouter.js");
const orderrderRouter = require("../router/orderRouter.js");
const blogRouter=require("../router/blogRouter.js")
const cartRouter = require("../router/cartRouter.js");
const enquaryRouter=require("../router/enquaryRouter.js")
const Notification=require("../database/notificationModel.js");
const catchAsync = require("../utility/catchAsync.js");
const notificationController=require("../controller/notificationController.js")
const authController=require("../controller/authController.js")

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  resave:true,
  saveUninitialized:true,
  secret:process.env.SESSION_SECRET
}))

// set view engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

// render static file
app.use("/", viewRouter);
app.use(express.static(path.join(__dirname, "../public")));

// router
app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use("/product", productRouter);
app.use("/blogs", blogRouter);
app.use("/order", orderrderRouter);
app.use("/cart", cartRouter);
app.use("/enquary", enquaryRouter);

// push notification............

// const vapidKeys = webPush.generateVAPIDKeys();
// console.log(vapidKeys);

// const publicVapidKey =
//   'BO64nFLjYDrOH1GvwXftIEEroUpihOost6Rcutdw1O-rqTDIFgS2sZwNTApxSAYFZ_JaIeS2Ul75qXhuhhzq3ao';
// const privateVapidKey = 'P-SLRT-rJqQBLeXdL1glzwclnHWzHxzW8NN5OhSi5yM';

// webPush.setVapidDetails("mailto:debashishmeher955@gmail.com",publicVapidKey,privateVapidKey);

// ?routes
app.post("/subscribe",authController.protect,notificationController.createNotification)

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
