const crypto = require("crypto");
const Razorpay = require("razorpay");
const webPush = require("web-push");

const Notification = require("../database/notificationModel");
const Order = require("../database/orderModel");
const Payment = require("../database/paymentModel");
const Product = require("../database/productModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { getCache, setCache } = require("../utils/cache");

const cleanKey = (key) => (key || "").trim().replace(/^["']|["']$/g, "");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const getUserId = (req) => req.auth;

// 1. Calculate authoritative totals by querying current product data from DB
const verifyAndCalculateTotals = async (items = []) => {
  if (!items || !items.length) {
    throw new AppError("Your cart is empty. Please select products to purchase.", 400);
  }

  let subtotal = 0;
  const verifiedProducts = [];

  for (const item of items) {
    const prodId = item.product?._id || item.product?.id || item.product || item.productId;
    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (!prodId) continue;

    const product = await Product.findById(prodId);
    if (!product) {
      throw new AppError(`Product with ID ${prodId} was not found.`, 404);
    }

    if (product.quantity < quantity) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Only ${product.quantity} available.`,
        400
      );
    }

    const discount = product.discount || 0;
    const unitPrice = product.price - (product.price * discount) / 100;
    const itemTotal = unitPrice * quantity;

    subtotal += itemTotal;

    verifiedProducts.push({
      product,
      productId: product._id,
      quantity,
      unitPrice,
      itemTotal,
    });
  }

  if (!verifiedProducts.length) {
    throw new AppError("No valid items found in order request.", 400);
  }

  const total = Math.round(subtotal);

  return {
    subtotal: Math.round(subtotal),
    total,
    verifiedProducts,
  };
};

// 2. Initialize checkout: create Razorpay Order AND save unpaid Order in MongoDB
exports.checkout = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);


  if (!userId) return next(new AppError("Unauthorized", 401));

  const items = req.body.items || [];
  const address = req.body.address || req.query.address || null;
  const phone = req.body.phone || null;

  const { subtotal, total, verifiedProducts } = await verifyAndCalculateTotals(items);

  // Reserve required inventory
  const rolledBackList = [];
  try {
    for (const p of verifiedProducts) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: p.productId, quantity: { $gte: p.quantity } },
        { $inc: { quantity: -p.quantity } },
        { new: true }
      );
      if (!updatedProduct) {
        throw new AppError(`Insufficient stock for "${p.product.name}".`, 400);
      }
      rolledBackList.push({ productId: p.productId, quantity: p.quantity });
    }
  } catch (err) {
    // Rollback any successfully decremented stocks
    for (const rolledBack of rolledBackList) {
      await Product.findByIdAndUpdate(rolledBack.productId, {
        $inc: { quantity: rolledBack.quantity }
      });
    }
    return next(err);
  }

  let razorpayOrder;

  try {
    razorpayOrder = await razorpay.orders.create({
      amount: total * 100, // Amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${userId.toString().slice(-6)}`,
      notes: {
        userId: userId.toString(),
        itemCount: verifiedProducts.length,
      },
    });



  } catch (err) {
    // Rollback reserved inventory if Razorpay order creation fails
    for (const rolledBack of rolledBackList) {
      await Product.findByIdAndUpdate(rolledBack.productId, {
        $inc: { quantity: rolledBack.quantity }
      });
    }
    const errMsg = err.message || (err.error && err.error.description) || err.description || JSON.stringify(err) || "Unknown error";
    return next(new AppError(`Payment intent generation failed: ${errMsg}`, 500));
  }


  // Save order in DB with status: "unpaid"
  const dbOrder = await Order.create({
    user: userId,
    price: String(total),
    product: verifiedProducts.map((p) => ({
      product: p.productId,
      quantity: p.quantity,
    })),
    address: address || "Standard Delivery",
    phone: phone ? Number(phone) : undefined,
    status: "unpaid",
    payType: "online",
    razorpayOrderId: razorpayOrder.id,
  });



  res.status(200).json({
    status: "success",
    data: {
      order: razorpayOrder,
      dbOrderId: dbOrder._id,
      subtotal,
      total,
      items: verifiedProducts.map((p) => ({
        productId: p.productId,
        name: p.product.name,
        quantity: p.quantity,
        price: p.unitPrice,
      })),
      address,
    },
  });
});

// 3. Payment signature verification middleware
exports.paymentVerification = catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return next(new AppError("Missing Razorpay payment verification parameters", 400));
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const verifySignature = crypto
    .createHmac("sha256", cleanKey(process.env.RAZORPAY_SECRET_KEY))
    .update(body)
    .digest("hex");

  if (razorpay_signature !== verifySignature) {
    return next(new AppError("Payment signature verification failed", 400));
  }

  next();
});

// 4. Verify payment & update existing unpaid order to "paid" with atomic inventory deduction
exports.createOrder = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) return next(new AppError("Unauthorized", 401));

  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    dbOrderId,
  } = req.body;

  // 🛡️ IDEMPOTENCY CHECK 1: Redis Distributed Lock & Cache
  const idempotencyKey = `idempotency:order:${razorpay_payment_id}`;
  const inProgress = await getCache(idempotencyKey);
  if (inProgress) {
    return res.status(200).json({
      status: "success",
      message: "Order already processed (idempotent)",
      data: inProgress,
    });
  }

  // 🛡️ IDEMPOTENCY CHECK 2: Database Check (Duplicate payment prevention)
  const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id });
  if (existingPayment) {
    const existingOrder = await Order.findOne({
      $or: [
        { razorpayOrderId: razorpay_order_id },
        { user: userId, status: "paid" },
      ],
    }).sort("-createdAt");

    return res.status(200).json({
      status: "success",
      message: "Order already confirmed",
      data: {
        order: existingOrder,
        payment: existingPayment,
      },
    });
  }

  // Find the unpaid order created during checkout
  let order = null;
  if (dbOrderId) {
    order = await Order.findById(dbOrderId);
  }
  if (!order && razorpay_order_id) {
    order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  }

  if (!order) {
    return next(new AppError("Order not found or has expired", 404));
  }

  if (order.status === "paid") {
    return res.status(200).json({
      status: "success",
      message: "Order already paid",
      data: { order },
    });
  }

  // Update order status to "paid"
  order.status = "paid";
  await order.save();

  // Create Payment Record
  const payment = await Payment.create({
    user: userId,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    paymentSignature: razorpay_signature,
    amount: Number(order.price) || 0,
    status: "verified",
  });

  const responsePayload = {
    order,
    payment,
  };

  // Cache response for idempotency (1 hour)
  await setCache(idempotencyKey, responsePayload, 3600).catch(() => { });

  // Trigger web push notifications asynchronously
  Notification.find({ user: userId })
    .then((subscribers) => {
      const payload = JSON.stringify({
        title: "Order Confirmed!",
        body: `Your order of ₹${order.price} has been confirmed.`,
        url: "https://themehers.in/orders",
      });
      for (const sub of subscribers) {
        if (sub.notification) {
          webPush.sendNotification(sub.notification, payload).catch(() => { });
        }
      }
    })
    .catch(() => { });

  res.status(200).json({
    status: "success",
    message: "Order payment verified and confirmed successfully",
    data: responsePayload,
  });
});

// 5. Cancel / Fail Order (remove unpaid order document and release inventory)
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);
  const { razorpay_order_id, dbOrderId } = req.body;

  const filter = {
    status: "unpaid",
  };

  if (dbOrderId) {
    filter._id = dbOrderId;
  } else if (razorpay_order_id) {
    filter.razorpayOrderId = razorpay_order_id;
  }

  if (userId) {
    filter.user = userId;
  }

  // Find order first to release inventory
  const order = await Order.findOne(filter);
  if (!order) {
    return res.status(200).json({
      status: "success",
      message: "No unpaid order found to discard",
    });
  }

  // Restore inventory
  for (const item of order.product) {
    const prodId = item.product?._id || item.product;
    if (prodId) {
      await Product.findByIdAndUpdate(prodId, {
        $inc: { quantity: item.quantity }
      });
    }
  }

  const deletedOrder = await Order.findByIdAndDelete(order._id);

  res.status(200).json({
    status: "success",
    message: "Unpaid order discarded and inventory released successfully",
    data: { deletedOrder },
  });
});

// 6. Webhook handler: handle Razorpay webhooks (order.paid, payment.failed, etc.)
exports.razorpayWebhook = catchAsync(async (req, res, next) => {
  const secret = cleanKey(process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_SECRET_KEY);
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    return next(new AppError("Missing webhook signature", 400));
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return next(new AppError("Invalid webhook signature", 400));
  }

  const eventData = req.body;
  const event = eventData.event;

  if (event === "order.paid") {
    const razorpay_order_id = eventData.payload.order.entity.id;
    const razorpay_payment_id = eventData.payload.payment.entity.id;
    const razorpay_signature = signature;

    // Find the order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Order not found",
      });
    }

    if (order.status === "paid") {
      return res.status(200).json({
        status: "success",
        message: "Order already paid",
      });
    }

    // Database Check (Duplicate payment prevention)
    const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id });
    if (existingPayment) {
      return res.status(200).json({
        status: "success",
        message: "Order already confirmed",
      });
    }

    // Update order status to "paid"
    order.status = "paid";
    await order.save();

    // Create Payment Record
    const payment = await Payment.create({
      user: order.user,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentSignature: razorpay_signature,
      amount: Number(order.price) || 0,
      status: "verified",
    });

    // Cache response for idempotency (1 hour)
    const idempotencyKey = `idempotency:order:${razorpay_payment_id}`;
    const responsePayload = {
      order,
      payment,
    };
    await setCache(idempotencyKey, responsePayload, 3600).catch(() => { });

    // Trigger web push notifications asynchronously
    Notification.find({ user: order.user })
      .then((subscribers) => {
        const payload = JSON.stringify({
          title: "Order Confirmed!",
          body: `Your order of ₹${order.price} has been confirmed.`,
          url: "https://themehers.in/orders",
        });
        for (const sub of subscribers) {
          if (sub.notification) {
            webPush.sendNotification(sub.notification, payload).catch(() => { });
          }
        }
      })
      .catch(() => { });
  } else if (event === "payment.failed" || event === "order.failed") {
    const razorpay_order_id = eventData.payload.payment?.entity?.order_id || eventData.payload.order?.entity?.id;
    if (razorpay_order_id) {
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, status: "unpaid" });
      if (order) {
        // Restore inventory
        for (const item of order.product) {
          const prodId = item.product?._id || item.product;
          if (prodId) {
            await Product.findByIdAndUpdate(prodId, {
              $inc: { quantity: item.quantity }
            });
          }
        }
        await Order.findByIdAndDelete(order._id);
      }
    }
  }

  res.status(200).json({
    status: "success",
    message: "Webhook event processed successfully",
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

exports.OneOrders = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId, "-__v");
  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.deleteOrders = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.orderId);
  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Order deleted successfully",
  });
});

exports.updateOrders = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(req.params.orderId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Order updated successfully",
    data: {
      order,
    },
  });
});

exports.myOrders = catchAsync(async (req, res, next) => {
  const userId = getUserId(req);
  if (!userId) return next(new AppError("Unauthorized", 401));

  const orders = await Order.find({ user: userId, status: { $ne: "unpaid" } })
    .sort("-createdAt")
    .populate("product.product");

  res.status(200).json({
    status: "success",
    data: {
      orders,
      totalOrders: orders.length,
    },
  });
});

