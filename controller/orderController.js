const Order = require("../database/orderModel");
const Product = require("../database/productModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/AppError");
const Cart = require("../database/cartModel");
const crypto = require("crypto");

const Razorpay = require("razorpay");
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
  let price = 0;
  let productids = [];
  for (let i = 0; i < products.length; i++) {
    const el = products[i];
    const productPrice =
      (el.product.price - (el.product.price * el.product.discount) / 100) *
      el.quantity;
    price += productPrice;
    productids.push(el.id);
  }
  req.body.price = price;
  req.body.product = productids;
  req.body.address = address;
  const order = await Order.create(req.body);
  if (order) {
    await Cart.deleteMany({ user: req.user.id });
  }
  console.log(order,req.body);
  
  res.status(201).render("orderSuccess", { order });
});

exports.allOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({
    status: { $ne: "delivered" },
  }).populate("product.productId");
  res.status(200).json({
    status: "success",
    orders,
  });
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
