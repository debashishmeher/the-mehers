const multer = require("multer");
const sharp = require("sharp");

const Blog = require("../database/blogsModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const multerstorage = multer.memoryStorage();

const multerfilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("not an image, please upload only image files", 400), false);
  }
};

const blogUpload = multer({
  storage: multerstorage,
  fileFilter: multerfilter,
});

exports.blogPhoto = blogUpload.single("image");

exports.processimg = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `blog-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 300)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`./public/image/blogs/${filename}`);

  const baseUrl = process.env.URL ? (process.env.URL.endsWith("/") ? process.env.URL : `${process.env.URL}/`) : "http://localhost:8000/";
  req.body.image = `${baseUrl}image/blogs/${filename}`;

  next();
});

exports.processupdate = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `blog-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 300)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`./public/image/blogs/${filename}`);

  const baseUrl = process.env.URL ? (process.env.URL.endsWith("/") ? process.env.URL : `${process.env.URL}/`) : "http://localhost:8000/";
  req.body.image = `${baseUrl}image/blogs/${filename}`;

  next();
});

exports.createBlog = catchAsync(async (req, res) => {
  const blog = await Blog.create(req.body);

  res.status(201).json({
    status: "success",
    message: "blog post created successfully",
    data: {
      blog,
    },
  });
});

exports.getBlogs = catchAsync(async (req, res) => {
  const blogs = await Blog.find();

  res.status(200).json({
    status: "success",
    data: {
      blogs,
      totalBlogs: blogs.length,
    },
  });
});

exports.getOneblog = catchAsync(async (req, res) => {
  const blog = await Blog.findById(req.params.blogId);

  res.status(200).json({
    status: "success",
    data: {
      blog,
    },
  });
});

exports.updateblogs = catchAsync(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.blogId,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    message: "blog updated successfully",
    data: {
      blog,
    },
  });
});

exports.deleteBlogs = catchAsync(async (req, res) => {
  await Blog.findByIdAndDelete(req.params.blogId);

  res.status(200).json({
    status: "success",
    message: "blog deleted successfully",
  });
});
