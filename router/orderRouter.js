const express = require("express");
const Router = express.Router();
const orderController = require("../controller/orderController");
const authController = require("../controller/authController");
// const viewController = require("../controller/viewController");

Router.route("/")
  .get(authController.protect,authController.accessTo("admin"),orderController.allOrders);


Router.route("/order").post(authController.protect,orderController.paymentVerification,orderController.createOrder)
Router.route("/checkout")
  .get(authController.protect,orderController.checkout)


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
