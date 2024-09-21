const Blog = require("../database/blogsModel");
const catchAsync = require("../utility/catchAsync");
const multer = require("multer");
const sharp = require("sharp");

const multerstorage = multer.memoryStorage();
const multerfilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("not an image! please check.", 400), false);
  }
};

const blogUpload = multer({
  storage: multerstorage,
  fileFilter: multerfilter,
});
exports.blogPhoto = blogUpload.single("image");
exports.processimg = catchAsync(async (req, res, next) => {
  console.log("processing image");
  console.log(req.file);
  req.body.image = `blog-${Date.now()}.jpeg`;
  console.log(req.body.photo);
  await sharp(req.file.buffer)
    .resize(600,300)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`./public/image/blogs/${req.body.image}`);
  console.log("process finish");
  next();
});
exports.processupdate = catchAsync(async (req, res, next) => {
  console.log("processing image");
  if (req.file) {
    console.log(req.file);
    const imgname = await Blog.findById(req.params.blogId).select("image");
    console.log(imgname);
    req.body.image = imgname.image.split(".")[0];
    console.log(req.body.image);
    await sharp(req.file.buffer)
      .resize(600,300)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`./public/image/blogs/${req.body.image}`);
    console.log("process finish");
    return next();
  }
  next();
});

exports.createBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.create(req.body);
  res.status(201).json({
    status: "success",
    message: "blog post created",
  });
});

exports.getBlogs = catchAsync(async (req, res, next) => {
  const blogs = await Blog.find();
  res.status(200).json({
    status: "success",
    blogs,
  });
});

exports.getOneblog = catchAsync(async (req, res, next) => {
  const blogs = await Blog.findById(req.params.blogId);
  res.status(200).json({
    status: "success",
    blogs,
  });
});
exports.updateblogs = catchAsync(async (req, res, next) => {
  req.body.createdAt = Date.now();
  await Blog.findByIdAndUpdate(req.params.blogId, req.body);

  res.status(200).json({
    status: "success",
    message: "blog update successfully",
  });
});
exports.deleteBlogs = catchAsync(async (req, res, next) => {
  await Blog.findByIdAndDelete(req.params.blogId);
  res.status(200).json({
    status: "success",
    message: "blog delete successfully",
  });
});
