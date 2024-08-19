const Order = require("../database/orderModel");
const Product= require("../database/productModel");
const catchAsync = require("../utility/catchAsync");
const Cart = require("../database/cartModel");
const crypto = require("crypto");


const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// checkout-----------------------------------------
exports.checkout = async (req, res) => {
  const phone = req.body.phone;
  const address = req.body.address;
  const payType = req.body.payType;
  try {
    const user = req.user;
    const products = await Cart.find({ user: req.user.id });
    let price = 0;

    for (let i = 0; i < products.length; i++) {
      const el = products[i];
      const productPrice = el.product.price * el.quantity;
      price += productPrice;
    }
    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: "order_receipt",
      payment_capture: 1,
    });
    // Redirect the user to the Razorpay payment page
    res.status(200).json({
      paymentPage: order.short_url,
      status: "success",
      order,
      user,
      phone,
      address,
      payType,
    });
    // res.redirect(order.short_url);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order");
  }
};

exports.paymentVerification = catchAsync(async (req, res, next) => {
  if (req.query.payType === "online") {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const verifySignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");
  if(razorpay_signature===verifySignature){
    return next()
  }
  }
});

exports.createOrder = catchAsync(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  const products = await Cart.find({ user: req.user.id });
  const { phone, address, payType } = req.query;
  let price = 0;
  let productids = [];
  for (let i = 0; i < products.length; i++) {
    const el = products[i];
    const productPrice = el.product.price * el.quantity;
    price += productPrice;
    productids.push(el.id);
  }
  req.body.price = price;
  req.body.product = productids;
  req.body.phone = phone;
  req.body.address = address;
  req.body.payType = payType;
  const data = req.body;
  const orderfood = await FoodOrder.create(req.body);
  res.status(201).json({
    status: "success",
    message: "order placed",
    orderfood,
    data,
  });
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
