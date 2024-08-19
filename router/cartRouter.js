const express = require("express");
const Router = express.Router();
const authController = require("../controller/authController");
const cartController = require("../controller/cartController");

Router.get("/", authController.protect, cartController.getUserItems);
Router.route("/:productId").post(authController.protect, cartController.addItem);
Router.route("/:itemId")
  .patch(authController.protect, cartController.updateUserItems)
  .delete(authController.protect, cartController.deleteUserItems);

module.exports = Router;
