const userController = require("../controller/userController");
const authController = require("../controller/authController");
const addressController = require("../controller/addressController");
const express = require("express");

const router = express.Router();



router.route("/")
  .get(authController.protect, userController.getMe)
  .post(
    authController.protect,
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.createUser
  )
  .patch(
    authController.protect,
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.editme
  );

router.route("/sessions")
  .get(authController.protect, userController.getActiveSessions);

router.route("/sessions/:id")
  .delete(authController.protect, userController.revokeSession);

router.route("/address")
  .get(authController.protect, addressController.getUserAddress)
  .post(authController.protect, addressController.createAddress);

router.route("/address/:id")
  .patch(authController.protect, addressController.updateUserAddress)
  .delete(authController.protect, addressController.deleteUserAddress);

module.exports = router;