const express = require("express");
const Router = express.Router();
const categoryController = require("../controller/categoryController");
const authController = require("../controller/authController");

Router.route("/")
  .get(categoryController.getAllCategories)
  .post(
    authController.protect,
    authController.accessTo("admin"),
    categoryController.categoryPhoto,
    categoryController.processCategoryPhoto,
    categoryController.createCategory
  );

// Define reorder route before :id to prevent mapping conflict
Router.route("/reorder")
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    categoryController.reorderCategories
  );

Router.route("/:id")
  .patch(
    authController.protect,
    authController.accessTo("admin"),
    categoryController.categoryPhoto,
    categoryController.processCategoryPhoto,
    categoryController.updateCategory
  )
  .delete(
    authController.protect,
    authController.accessTo("admin"),
    categoryController.deleteCategory
  );

module.exports = Router;
