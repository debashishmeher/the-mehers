const express = require("express");
const Router = express.Router();
const orderController = require("../controller/orderController");
const authController = require("../controller/authController");
const notificationController = require("../controller/notificationController");
// const viewController = require("../controller/viewController");

Router.route("/").get(
  authController.protect,
  authController.accessTo("admin"),
  orderController.allOrders
);



Router.route("/order").post(
  authController.protect,
  orderController.paymentVerification,
  orderController.createOrder
);
Router.route("/checkout").post(authController.protect, orderController.checkout);
Router.route("/cancel").post(authController.protect, orderController.cancelOrder);
Router.route("/webhook").post(orderController.razorpayWebhook);

Router.route("/my-orders").get(
  authController.protect,
  orderController.myOrders
);

Router.route("/:orderId")
  .get(orderController.OneOrders)
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    orderController.updateOrders
  )
  .delete(
    authController.protect,
    authController.accessTo("admin"),
    orderController.deleteOrders
  );

module.exports = Router;
