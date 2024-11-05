const express = require("express");
const Router = express.Router();
const blogController=require("../controller/blogsController")
const authContoller=require("../controller/authController")
const viewController=require("../controller/viewController")

Router.get("/", blogController.getBlogs);
Router.use(authContoller.protect, authContoller.accessTo("admin"));
Router.route("/").post(
  blogController.blogPhoto,
  blogController.processimg,
  blogController.createBlog
);
Router.route("/:blogId/admin")
  .get(viewController.blogedit)
  .patch(
    blogController.blogPhoto,
    blogController.processupdate,
    blogController.updateblogs
  )
  .delete(blogController.deleteBlogs);

module.exports = Router;
