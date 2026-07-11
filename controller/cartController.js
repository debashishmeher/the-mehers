const Address = require("../database/addressModel");
const Cart = require("../database/cartModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const calculateCartSummary = (items) => {
  let total = 0;
  let discount = 0;
  let shipping = 40;

  items.forEach((item) => {
    if (!item.product) {
      return;
    }

    const discountedPrice =
      item.product.price - (item.product.price * item.product.discount) / 100;

    total += discountedPrice * item.quantity;
    discount += ((item.product.price * item.product.discount) / 100) * item.quantity;
  });

  if (total >= 5000) {
    shipping = 0;
  }

  return {
    total,
    discount,
    shipping,
  };
};

exports.addItem = catchAsync(async (req, res, next) => {
  const quantity = Number(req.body.quantity || 1);
  const productId = req.body.product || req.params.productId;

  if (quantity < 1 || quantity > 5) {
    return next(new AppError("quantity is not valid", 400));
  }

  const existingItem = await Cart.findOne({
    user: req.user.id,
    product: productId,
  });

  if (existingItem) {
    return next(new AppError("item already exists in your cart", 409));
  }

  const item = await Cart.create({
    ...req.body,
    quantity,
    product: productId,
    user: req.user.id,
  });

  res.status(201).json({
    status: "success",
    message: "item added to cart successfully",
    data: {
      item,
    },
  });
});

exports.getUserItems = catchAsync(async (req, res) => {
  const items = await Cart.find({ user: req.user.id });
  const summary = calculateCartSummary(items);

  res.status(200).json({
    status: "success",
    data: {
      items,
      ...summary,
    },
  });
});

exports.getUsercheckout = catchAsync(async (req, res) => {
  const [items, address] = await Promise.all([
    Cart.find({ user: req.user.id }),
    Address.find({ user: req.user.id }),
  ]);

  const summary = calculateCartSummary(items);

  res.status(200).json({
    status: "success",
    data: {
      items,
      address,
      ...summary,
    },
  });
});

exports.updateUserItems = catchAsync(async (req, res, next) => {
  const item = await Cart.findById(req.params.itemId);

  if (!item) {
    return next(new AppError("cart item not found", 404));
  }

  item.quantity = Number(req.body.quantity);

  if (item.quantity < 1 || item.quantity > 5) {
    return next(new AppError("quantity is not valid", 400));
  }

  await item.save();

  res.status(200).json({
    status: "success",
    message: "cart quantity updated successfully",
    data: {
      item,
    },
  });
});

exports.deleteUserItems = catchAsync(async (req, res) => {
  await Cart.findByIdAndDelete(req.params.itemId);

  res.status(200).json({
    status: "success",
    message: "cart item deleted successfully",
  });
});
