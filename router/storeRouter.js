const express = require("express");
const Router = express.Router();
const storeController = require("../controller/storeController");

Router.get("/", storeController.getStoreHome);

module.exports = Router;
