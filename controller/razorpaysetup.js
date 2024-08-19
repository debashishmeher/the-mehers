const Food = require("../database/foodModel");
const catchAsync = require("../utility/catchAsync");

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});
exports.checkout = catchAsync(async (req, res) => {
  try {
    const food = await Food.findById(req.params.productId);

    const order = await razorpay.orders.create({
      amount: food.price * 100,
      currency: "INR",
      receipt: "order_receipt",
      payment_capture: 1,
    });

    // Redirect the user to the Razorpay payment page
    res.status(200).json({
      paymentPage: order.short_url,
      status: "success",
      order,
    });
    // res.redirect(order.short_url);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order");
  }
});
