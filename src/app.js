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

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

const publicVapidKey =
  "BGx8a9-bGaQeKUuW-lsQb3LGIIH1OL9w9eq-ERdK7HrtIHbAmcn2yBxO32E8d8KaqrAYA3BXgMXSDXaGJzxzays";
const privateVapidKey = "wd3-Y8CYkztOMMlithbRR7DFq-2_U1A2vHELx2BhbWA";

webPush.setVapidDetails("mailto:debashishmeher955@gmail.com",publicVapidKey,privateVapidKey);

// ?routes
app.post("/subscribe",catchAsync(async(req,res)=>{
  const suscription=req.body;
  let user;
  if (res.locals.user) {
    user = res.locals.user.id;
  }
  console.log(user,suscription);
  const notification=new Notification({
    user:user,
    notification:suscription
  })
  await notification.save()
  res.status(201).json({
    status:"success",
    message:"sending notification"
  })

  const payload=JSON.stringify({ title:"push testing"})

  // webPush.sendNotification(suscription,payload).catch(err=>{
  //   console.log(err);
  // })
}))

app.all("*", (req, res, next) => {
  return next(new AppError(`${req.originalUrl} not found on the server`, 404));
});

app.use(globalErrorHandelling);

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`server listening at port no ${process.env.PORT}`);
});
