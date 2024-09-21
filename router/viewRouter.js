const express = require("express");
const Router = express.Router();
const viewController = require("../controller/viewController");
const authControl = require("../controller/authController");

Router.use(authControl.isLogin)

Router.get("/",authControl.isLogin,viewController.home)
Router.get("/shop",viewController.product)
Router.get("/product/:productId",viewController.item)
Router.get("/login",viewController.login)
Router.get("/signup",viewController.signup)
Router.get("/forgot",viewController.forgotpass)
Router.get("/blogs",viewController.blogs)
Router.get("/blogs/:blogId",viewController.blogInfo)
Router.get("/me",authControl.protect,viewController.me)
Router.get("/admin",authControl.protect,authControl.accessTo("admin"),viewController.admin)
Router.get("/admin/products",viewController.adminproduct)
Router.get("/admin/products/create",viewController.adminproductcreate)
Router.get("/admin/orders",viewController.adminorder)
Router.get("/admin/finance",viewController.adminfinance)
Router.get("/admin/reviews",viewController.adminreviews)
Router.get("/admin/blogs",viewController.adminblogs)
Router.get("/admin/blogs/create",viewController.adminblogscreate)
Router.get("/admin/enquery",viewController.adminenquary)
Router.get("/enquary/:enquaryId/schedule",viewController.scheduleform)

module.exports = Router;
