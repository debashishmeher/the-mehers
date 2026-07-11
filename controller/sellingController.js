const Product = require("../database/productModel");
const Sell = require("../database/sellingModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.sellCreate = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product || product.quantity <= 0) {
    return next(new AppError("item quantity is not enough", 400));
  }

  product.quantity = product.quantity * 1 - 1;
  await product.save();

  const selling = await Sell.create({
    ...req.body,
    product: req.params.productId,
    price: product.price,
  });

  res.status(201).json({
    status: "success",
    message: "product sold successfully",
    data: {
      selling,
      product,
    },
  });
});
