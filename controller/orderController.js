const Order = require("../database/orderModel");
const Product = require("../database/productModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/AppError");
const Cart = require("../database/cartModel");
const Notification=require("../database/notificationModel")
const crypto = require("crypto");
const Payment = require("../database/paymentModel");
const webPush = require("web-push");

const Razorpay = require("razorpay");
const { log } = require("util");
const razorpay = new Razorpay({
  key_id: "rzp_test_NkNigZ2328KHsb",
  key_secret: "lxiyUCrBFR1ZVqB1bERofBGJ",
});

// checkout-----------------------------------------
exports.checkout = async (req, res) => {
  const address = req.body.address;
  try {
    const user = req.user;
    const items = await Cart.find({ user: req.user.id });
    let total = 0;
    let sipping = 40;

    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      if (el.product) {
        total =
          total +
          (el.product.price - (el.product.price * el.product.discount) / 100) *
            el.quantity;
      }
    }
    if (total >= 5000) {
      sipping = 0;
    } else {
      total = total + sipping;
    }

    console.log(user, total, address);

    const order = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: "order_receipt",
      payment_capture: 1,
    });

    // Redirect the user to the Razorpay payment page
    res.status(200).json({
      status: "success",
      order,
      user,
      address,
    });
    // res.redirect(order.short_url);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order");
  }
};

exports.paymentVerification = catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const verifySignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(body.toString())
    .digest("hex");
  console.log(req.body);

  if (razorpay_signature === verifySignature) {
    req.body.payType = "online";
    console.log("payment verify");

    return next();
  } else {
    return next(new AppError("signature missmatch", 404));
  }
});

exports.createOrder = catchAsync(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  const products = await Cart.find({ user: req.user.id });
  const { address } = req.query;
  let userpayment;
  if (products.length <= 0) {
    return next(new AppError("your cart is empty", 404));
  } else {
    let price = 0;
    let productids = [];
    for (let i = 0; i < products.length; i++) {
      const el = products[i];
      const productPrice =
        (el.product.price - (el.product.price * el.product.discount) / 100) *
        el.quantity;
      price += productPrice;
      const product=await Product.findById(el.product.id)
      console.log(product);
      
      product.quantity = product.quantity * 1 - el.quantity
      await product.save()
      productids.push(el.id);
    }
    req.body.price = price;
    req.body.product = productids;
    req.body.address = address;
    const order = await Order.create(req.body);
    if (order) {
      userpayment = new Payment({
        user: req.user.id,
        paymentId: req.body.razorpay_payment_id,
        orderId: req.body.razorpay_order_id,
        amount: req.body.price,
        paymentSignature: req.body.razorpay_signature,
      });

      await userpayment.save();
      await Cart.deleteMany({ user: req.user.id });
      
    }

    res.status(201).render("orderSuccess", { order,userpayment });
    const notify = await Notification.find({ user: req.user.id });
    const payload = JSON.stringify({
      title: "order confirmed",
      url: "https://themehers.in/",
    });
    for (let i = 0; i < notify.length; i++) {
      const el = notify[i];
      webPush.sendNotification(el.notification, payload).catch((err) => {
        console.log(err);
      });
    }
  }
});

exports.allOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({
    status: { $ne: "delivered" },
  }).populate("product.productId");
  console.log(orders);
  
  res.status(200).render("adminorder",{orders});
});

exports.OneOrders = catchAsync(async (req, res, next) => {
  const orderId = req.params.orderId;
  const order = await Order.findById(orderId, "-__v").populate(
    "product.productId"
  );
  res.status(200).json({
    status: "success",
    order,
  });
});

exports.deleteOrders = catchAsync(async (req, res, next) => {
  const orderId = req.params.orderId;
  await Order.findByIdAndDelete(orderId);
  res.status(200).json({
    status: "success",
    message: "order delete successfully",
  });
});

exports.updateOrders = catchAsync(async (req, res, next) => {
  const orderId = req.params.orderId;
  await Order.findByIdAndUpdate(orderId, req.body);
  res.status(200).json({
    status: "success",
    message: "orderupdate successfully",
  });
});
