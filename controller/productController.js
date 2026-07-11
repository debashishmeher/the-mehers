const multer = require("multer");
const sharp = require("sharp");

const Cart = require("../database/cartModel");
const Product = require("../database/productModel");
const Review = require("../database/reviewModel");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const buildProductFilters = (query) => {
  const queryObj = { ...query };
  const excludedFields = ["page", "sort", "limit", "fields", "search"];

  excludedFields.forEach((field) => delete queryObj[field]);

  if (queryObj.category && !queryObj.catagory) {
    queryObj.catagory = queryObj.category;
  }

  delete queryObj.category;

  if (query.search?.trim()) {
    const searchRegex = { $regex: query.search.trim(), $options: "i" };
    queryObj.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { catagory: searchRegex },
    ];
  }

  const queryStr = JSON.stringify(queryObj).replace(
    /\b(gt|gte|lt|lte)\b/g,
    (match) => `$${match}`
  );

  return JSON.parse(queryStr);
};

const multerstorage = multer.memoryStorage();

const multerfilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("not an image, please upload only image files", 400), false);
  }
};

const upload = multer({
  storage: multerstorage,
  fileFilter: multerfilter,
});

exports.photo = upload.fields([
  { name: "mainphoto", maxCount: 1 },
  { name: "photo", maxCount: 3 },
]);

exports.processimgmainphoto = catchAsync(async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  const baseUrl = process.env.URL ? (process.env.URL.endsWith("/") ? process.env.URL : `${process.env.URL}/`) : "http://localhost:8000/";

  if (req.files.mainphoto?.length) {
    const filename = `main-${Date.now()}.jpeg`;

    await sharp(req.files.mainphoto[0].buffer)
      .resize(500, 625)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`./public/image/product/${filename}`);

    req.body.mainphoto = `${baseUrl}image/product/${filename}`;
  }

  if (req.files.photo?.length) {
    const photoNames = [];

    for (let i = 0; i < req.files.photo.length; i += 1) {
      const file = req.files.photo[i];
      const fileName = `product-photo-${i}-${Date.now()}.jpeg`;

      await sharp(file.buffer)
        .resize(500, 625)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`./public/image/product/${fileName}`);

      photoNames.push(`${baseUrl}image/product/${fileName}`);
    }

    req.body.photo = photoNames;
  }

  next();
});

exports.createproduct = catchAsync(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    message: "product created successfully",
    data: {
      product,
    },
  });
});

exports.getAllproduct = catchAsync(async (req, res) => {
  const filters = buildProductFilters(req.query);
  const totalProducts = await Product.countDocuments(filters);
  const currentPage = Number.parseInt(req.query.page, 10) || 1;
  const itemsPerPage = Number.parseInt(req.query.limit, 10) || 10;
  const totalPages = Math.ceil(totalProducts / itemsPerPage) || 1;

  const features = new APIFeatures(Product.find(filters), req.query)
    .sort()
    .limitFields()
    .pagination();

  const products = await features.query;

  res.status(200).json({
    status: "success",
    data: {
      products,
      totalProducts,
      totalPages,
      currentPage,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  });
});

exports.getOneproduct = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.productId).populate("reviews");

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.updateproduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.productId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "product updated successfully",
    data: {
      product,
    },
  });
});

exports.deleteproduct = catchAsync(async (req, res) => {
  const productId = req.params.productId;
  const product = await Product.findByIdAndDelete(productId);
  await Cart.deleteMany({ product: productId });

  res.status(200).json({
    status: "success",
    message: "product deleted successfully",
    data: {
      product,
    },
  });
});

exports.createReview = catchAsync(async (req, res) => {
  if (!req.body.user) {
    req.body.user = req.user.id;
  }

  if (!req.body.product) {
    req.body.product = req.params.productId;
  }

  const review = await Review.create(req.body);

  res.status(201).json({
    status: "success",
    message: "review created successfully",
    data: {
      review,
    },
  });
});

exports.editReview = catchAsync(async (req, res) => {
  const reviewId = req.params.reviewId || req.params.id;
  const review = await Review.findByIdAndUpdate(reviewId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "review updated successfully",
    data: {
      review,
    },
  });
});
