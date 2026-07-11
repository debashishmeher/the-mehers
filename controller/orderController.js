const crypto = require("crypto");
const Razorpay = require("razorpay");
const webPush = require("web-push");

const Cart = require("../database/cartModel");
const Notification = require("../database/notificationModel");
const Order = require("../database/orderModel");
const Payment = require("../database/paymentModel");
const Product = require("../database/productModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const razorpay = new Razorpay({
  key_id: "rzp_test_NkNigZ2328KHsb",
  key_secret: "lxiyUCrBFR1ZVqB1bERofBGJ",
});

const calculateOrderTotals = (items) => {
  let subtotal = 0;
  let shipping = 40;

  items.forEach((item) => {
    if (!item.product) {
      return;
    }

    subtotal +=
      (item.product.price - (item.product.price * item.product.discount) / 100) *
      item.quantity;
  });

  if (subtotal >= 5000) {
    shipping = 0;
  }

  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
};

exports.checkout = catchAsync(async (req, res) => {
  const items = await Cart.find({ user: req.user.id });
  const totals = calculateOrderTotals(items);
  const address = req.query.address || req.body.address || null;

  const order = await razorpay.orders.create({
    amount: totals.total * 100,
    currency: "INR",
    receipt: "order_receipt",
    payment_capture: 1,
  });

  res.status(200).json({
    status: "success",
    data: {
      order,
      user: req.user,
      address,
      ...totals,
    },
  });
});

exports.paymentVerification = catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const verifySignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(body)
    .digest("hex");

  if (razorpay_signature !== verifySignature) {
    return next(new AppError("signature mismatch", 400));
  }

  req.body.payType = "online";
  next();
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const products = await Cart.find({ user: req.user.id });
  const { address } = req.query;

  if (!products.length) {
    return next(new AppError("your cart is empty", 400));
  }

  let price = 0;
  const orderItems = [];

  for (const item of products) {
    if (!item.product) continue;
    const productPrice =
      (item.product.price - (item.product.price * item.product.discount) / 100) *
      item.quantity;

    price += productPrice;

    const product = await Product.findById(item.product.id);

    if (product) {
      product.quantity = product.quantity * 1 - item.quantity;
      await product.save();
    }

    orderItems.push({
      product: item.product.id,
      quantity: item.quantity,
    });
  }

  const order = await Order.create({
    ...req.body,
    user: req.body.user || req.user.id,
    price,
    product: orderItems,
    address,
  });

  let userpayment = null;

  if (order) {
    userpayment = await Payment.create({
      user: req.user.id,
      paymentId: req.body.razorpay_payment_id,
      orderId: req.body.razorpay_order_id,
      amount: price,
      paymentSignature: req.body.razorpay_signature,
    });

    await Cart.deleteMany({ user: req.user.id });
  }

  const notify = await Notification.find({ user: req.user.id });
  const payload = JSON.stringify({
    title: "order confirmed",
    url: "https://themehers.in/",
  });

  for (const subscription of notify) {
    webPush.sendNotification(subscription.notification, payload).catch(() => {});
  }

  res.status(201).json({
    status: "success",
    message: "order created successfully",
    data: {
      order,
      payment: userpayment,
    },
  });
});

exports.allOrders = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== "all") {
    filter.status = req.query.status;
  }
  if (req.query.payType && req.query.payType !== "all") {
    filter.payType = req.query.payType;
  }

  const orders = await Order.find(filter).sort("-createdAt");

  res.status(200).json({
    status: "success",
    data: {
      orders,
      totalOrders: orders.length,
    },
  });
});

exports.OneOrders = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId, "-__v");

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.deleteOrders = catchAsync(async (req, res) => {
  await Order.findByIdAndDelete(req.params.orderId);

  res.status(200).json({
    status: "success",
    message: "order deleted successfully",
  });
});

exports.updateOrders = catchAsync(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.orderId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "order updated successfully",
    data: {
      order,
    },
  });
});
