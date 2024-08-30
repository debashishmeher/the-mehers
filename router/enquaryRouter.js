const express = require("express");
const Router = express.Router();
const authController = require("../controller/authController");
const enquaryController = require("../controller/enquaryController");
const scheduleController = require("../controller/scheduleController");

Router.route("/").post(enquaryController.createEnquary);

Router.route("/:enquaryId")
  .get(enquaryController.getOneEnquary)
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

Router.route("/:enquaryId/schedule")
  .post(
    authController.protect,
    authController.accessTo("admin"),
    scheduleController.createSchedule
  )
  .delete(
    authController.protect,
    authController.accessTo("admin"),
    enquaryController.deleteEnquary
  );

module.exports = Router;
