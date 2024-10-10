const express = require("express");
const Router = express.Router();

const authController=require("../controller/authController")
const viewController=require("../controller/viewController")
const sellingController=require('../controller/sellingController')
Router.use(authController.protect,authController.accessTo("admin"))
Router.post("/product/:productId/sell", sellingController.sellCreate)




module.exports=Router;
