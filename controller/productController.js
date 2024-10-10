const Product = require("../database/productModel");
const catchAsync = require("../utility/catchAsync");
const multer = require("multer");
const sharp = require("sharp");
const Review = require("../database/reviewModel");
const Cart = require("../database/cartModel");
const APIFeatures = require("../utility/APIFeatures");

// multer configuration------------------------------

const multerstorage = multer.memoryStorage();
const multerfilter = (req, file, cb) => {
  console.log(file);
  
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("not an image! please check.", 400), false);
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
  console.log("processing main image");
  console.log("starting", req.files.mainphoto, req.files.photo);
  console.log(req.files);
  
  
  if (req.files.mainphoto) {
    req.body.mainphoto = `main-${Date.now()}.jpeg`;
    console.log(req.body.mainphoto);
    await sharp(req.files.mainphoto[0].buffer)
      .resize(500, 625)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`./public/image/product/${req.body.mainphoto}`);
    console.log("process finish");
  }
  if(req.files.photo){
    const photoName=[]
    for (let i = 0; i < req.files.photo.length; i++) {
        const el = req.files.photo[i];
        const name=`product-photo-${i}-${Date.now()}.jpeg`
        await sharp(el.buffer)
            .resize(500, 625)
            .toFormat("jpeg")
            .jpeg({quality:90}).toFile(`./public/image/product//${name}`)
        console.log("phote created",i);
        photoName.push(name)
    }
    req.body.photo=photoName
  }

  next();
});

// create product------------------------------------------------------------------
exports.createproduct = catchAsync(async (req, res, next) => {
  console.log(req.body);
  
  const product = await Product.create(req.body);
  res.status(201).json({
    status: "success",
    message: "item create successful",
    product,
  });
});

// get all products------------------------------------------------------------------
exports.getAllproduct = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  console.log("a called");

  const products = await features.query;
  console.log(products);

  const number = products.length;
  // res.status(200).render("products",{products,number})
  res.status(200).json({
    status: "success",
    products,
    number,
  });
});

// get one food---------------------------------------------------------
exports.getOneproduct = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId).populate("reviews");
  res.status(200).render("product", { product });
});

// update food------------------------------------------------------------------
exports.updateproduct = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  await Product.findByIdAndUpdate(productId, req.body);
  res.status(200).json({
    status: "success",
    message: "product update successful",
  });
});

// delete food----------------------------------------------------------------
exports.deleteproduct = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  await Product.findByIdAndDelete(productId);
  await Cart.deleteMany({ product: productId });

  res.status(200).json({
    status: "success",
    message: "Product has been deleted",
  });
});

// review-controller-------------------------------------------
exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.product) req.body.food = req.params.productId;
  const review = await Review.create(req.body);

  res.status(201).json({
    status: "success",
    message: "review post successfully",
    review,
  });
});

exports.editReview = catchAsync(async (req, res, next) => {
  const reviewId = req.params.reviewId;
  const review = await Review.findByIdAndUpdate(reviewId, req.body);

  res.status(201).json({
    status: "success",
    message: "review update successfully",
  });
});
