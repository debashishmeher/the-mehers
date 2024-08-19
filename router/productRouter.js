const express = require("express");
const Router = express.Router();
const productController = require("../controller/productController");
const authController = require("../controller/authController");
// const viewController = require("../controller/viewController");

Router.route("/")
  .post(
    authController.protect,
    authController.accessTo("admin"),
    productController.productPhoto,
    productController.processimg,
    productController.createproduct
  )
  .get(productController.getAllproduct);

Router.route("/:productId")
  .get(productController.getOneproduct)
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    productController.updateproduct
  )
  .delete(
    authController.protect,
    authController.accessTo("admin"),
    productController.deleteproduct
  );

Router.route("/:productId/review").post(
  authController.protect,
  productController.createReview
);
Router.route("/:productId/review/:id").patch(
  authController.protect,
  // authController.checkUser("Review"),
  productController.editReview
);

module.exports = Router;