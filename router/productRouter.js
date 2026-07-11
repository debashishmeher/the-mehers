const express = require("express");
const Router = express.Router();
const productController = require("../controller/productController");
const authController = require("../controller/authController");

Router.route("/")
  .post(
    authController.protect,
    authController.accessTo("admin"),
    productController.photo,
    productController.processimgmainphoto,
    productController.createproduct
  )
  .get(productController.getAllproduct);

Router.route("/:productId")
  .get(productController.getOneproduct)
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    productController.photo,
    productController.processimgmainphoto,
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
  productController.editReview
);

module.exports = Router;
