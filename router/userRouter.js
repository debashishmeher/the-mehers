const express = require("express");
const userController = require("../controller/userController");
const authController = require("../controller/authController");
const addressController = require('../controller/addressController')

const Router = express.Router();

Router.route("/user")
  .get(
    authController.protect,
    authController.accessTo("admin", "seller"),
    userController.getalluser
  )
  .patch(
    authController.protect,
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.editme
  );
// Router.route("/user/:userId").patch(authController.protect,)
Router.route("/isAuthenticated").get(authController.protect, authController.isAuthenticated);
Router.route("/signup").post(authController.signup);
Router.route("/login").post(authController.login);
Router.route("/google-login").post(authController.googleLogin);
Router.route("/forgotpassword").post(authController.forgetpassword);
Router.route("/resetpassword/:resetToken").patch(authController.resetpassword);
Router.route("/upadatemypassword").patch(
  authController.protect,
  authController.updatePassword
);
Router.route("/refresh-token").post(authController.refreshToken);
Router.route("/logout").post(authController.logout);
Router.route("/sessions").get(authController.protect, authController.getActiveSessions);
Router.route("/sessions/:id").delete(authController.protect, authController.revokeSession);
Router.route("/address").post(authController.protect, addressController.createAddress);

Router.route("/:userId")
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    userController.updateUserRole
  )
  .delete(
    authController.protect,
    authController.accessTo("admin"),
    userController.deleteUser
  );

module.exports = Router;
