const multer = require("multer");
const sharp = require("sharp");
const Category = require("../database/categoryModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Multer configurations for category photo uploads
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, please upload only image files", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.categoryPhoto = upload.single("photo");

exports.processCategoryPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `category-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(400, 400)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`./public/image/product/${filename}`);

  const baseUrl = process.env.URL ? (process.env.URL.endsWith("/") ? process.env.URL : `${process.env.URL}/`) : "http://localhost:8000/";
  req.body.photo = `${baseUrl}image/product/${filename}`;

  next();
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
    // Sort by index ascending, then by name ascending
    const categories = await Category.find().sort({ index: 1, name: 1 });
    res.status(200).json({
        status: "success",
        results: categories.length,
        data: {
            categories
        }
    });
});

exports.createCategory = catchAsync(async (req, res, next) => {
    // If no custom index is sent, assign the next index based on total categories count
    if (req.body.index === undefined || req.body.index === "") {
        const count = await Category.countDocuments();
        req.body.index = count;
    }
    
    const newCategory = await Category.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            category: newCategory
        }
    });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!category) {
        return next(new AppError("No category found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            category
        }
    });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
        return next(new AppError("No category found with that ID", 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});

// Bulk reorder categories index
exports.reorderCategories = catchAsync(async (req, res, next) => {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) {
        return next(new AppError("Please provide an order array containing category ID and index.", 400));
    }

    // Update index numbers in database
    await Promise.all(
        order.map((item) =>
            Category.findByIdAndUpdate(item.id, { index: item.index })
        )
    );

    res.status(200).json({
        status: "success",
        message: "Categories reordered successfully."
    });
});
