const express = require("express");
const Router = express.Router();
const contentController = require("../controller/contentController");
const authController = require("../controller/authController");

Router.route("/")
  .get(contentController.getHomeContent)
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    contentController.updateHomeContent
  );

Router.route("/upload")
  .post(
    authController.protect,
    authController.accessTo("admin"),
    contentController.uploadContentPhoto,
    contentController.processContentPhoto,
    contentController.uploadImage
  );

module.exports = Router;
