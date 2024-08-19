const express = require("express");
const Router = express.Router();

const authController=require("../controller/authController")
const viewController=require("../controller/viewController")
Router.use(authController.protect,authController.accessTo("admin"))





module.exports=Router;
