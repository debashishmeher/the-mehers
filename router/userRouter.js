const express = require("express");
const userController = require("../controller/userController");
const authController = require("../controller/authController");
const addressController=require('../controller/addressController')

const Router = express.Router();

Router.route("/user")
  .get(
    authController.protect,
    authController.accessTo("admin", "seller"),
    userController.getalluser
  )
  .patch(
    authController.protect,
    userController.userPhoto,
    userController.processimg,
    userController.updateUser
  );
// Router.route("/user/:userId").patch(authController.protect,)
Router.route("/signup").post(authController.signup);
Router.route("/login").post(authController.login);
Router.route("/forgotpassword").post(authController.forgetpassword);
Router.route("/resetpassword/:resetToken").patch(authController.resetpassword);
Router.route("/upadatemypassword").patch(
  authController.protect,
  authController.updatePassword
);
Router.route("/address").post(authController.protect,addressController.createAddress)
module.exports = Router;
