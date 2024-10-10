const express = require("express");
const Router = express.Router();
const viewController = require("../controller/viewController");
const authControl = require("../controller/authController");

Router.use(authControl.isLogin)

Router.get("/", authControl.isLogin, viewController.home)
Router.get("/shop", viewController.product)
// Router.get("/shop/:catagory",viewController.product)
Router.get("/product/:productId", viewController.item)
Router.get("/login", viewController.login)
Router.get("/signup", viewController.signup)
Router.get("/forgot", viewController.forgotpass)
Router.get("/blogs", viewController.blogs)
Router.get("/blogs/:blogId", viewController.blogInfo)
Router.get("/about", viewController.about)
Router.get("/contact", viewController.contact)
Router.get("/me", authControl.protect, viewController.me)
Router.get("/admin", authControl.protect, authControl.accessTo("admin"), viewController.admin)
Router.get("/admin/products", authControl.protect, authControl.accessTo("admin"), viewController.adminproduct)
Router.get("/admin/product/:productId", authControl.protect, authControl.accessTo("admin"), viewController.offline)
Router.get("/admin/products/create", authControl.protect, authControl.accessTo("admin"), viewController.adminproductcreate)
Router.get("/admin/orders", authControl.protect, authControl.accessTo("admin"), viewController.adminorder)
Router.get("/admin/finance", authControl.protect, authControl.accessTo("admin"), viewController.adminfinance)
Router.get("/admin/reviews", authControl.protect, authControl.accessTo("admin"), viewController.adminreviews)
Router.get("/admin/blogs", authControl.protect, authControl.accessTo("admin"), viewController.adminblogs)
Router.get("/admin/blogs/create", authControl.protect, authControl.accessTo("admin"), viewController.adminblogscreate)
Router.get("/admin/enquery", authControl.protect, authControl.accessTo("admin"), viewController.adminenquary)
Router.get("/enquary/:enquaryId/schedule", authControl.protect, authControl.accessTo("admin"), viewController.scheduleform)

module.exports = Router;
