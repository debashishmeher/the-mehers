const express = require("express");
const Router = express.Router();
const authController = require("../controller/authController");
const enquaryController=require("../controller/enquaryController")

Router.route("/")
  .post(enquaryController.createEnquary)

Router.route("/:enquaryId")
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    enquaryController.updateEnquary
  )
  .delete(
    authController.protect,
    authController.accessTo("admin"),
    enquaryController.deleteEnquary
  );

module.exports = Router;
