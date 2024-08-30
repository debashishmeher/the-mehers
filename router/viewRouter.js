const express = require("express");
const Router = express.Router();
const viewController = require("../controller/viewController");
const authControl = require("../controller/authController");

Router.use(authControl.isLogin)

Router.get("/login",viewController.login)
Router.get("/admin",viewController.admin)
Router.get("/admin/products",viewController.adminproduct)
Router.get("/admin/products/create",viewController.adminproductcreate)
Router.get("/admin/orders",viewController.adminorder)
Router.get("/admin/finance",viewController.adminfinance)
Router.get("/admin/reviews",viewController.adminreviews)
Router.get("/admin/enquery",viewController.adminenquary)
Router.get("/enquary/:enquaryId/schedule",viewController.scheduleform)

module.exports = Router;
