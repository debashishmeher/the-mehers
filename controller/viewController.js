const Blog = require("../database/blogsModel");
const Enquary = require("../database/enquaryModel");
const Order = require("../database/orderModel");
const Product = require("../database/productModel");
const APIFeatures = require("../utils/APIFeatures");
const catchAsync = require("../utils/catchAsync");

const buildProductFilters = (query, catagory) => {
  const queryObj = { ...query };
  const excludedFields = ["page", "sort", "limit", "fields", "search"];

  excludedFields.forEach((field) => delete queryObj[field]);

  if (catagory) {
    queryObj.catagory = catagory;
  }

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

const sendViewJson = (res, view, data = {}, statusCode = 200) => {
  res.status(statusCode).json({
    status: "success",
    view,
    data,
  });
};

exports.home = catchAsync(async (req, res) => {
  const products = await Product.find();

  sendViewJson(res, "home", {
    user: res.locals.user || null,
    cart: res.locals.cart || 0,
    products,
  });
});

exports.product = catchAsync(async (req, res) => {
  const filters = buildProductFilters(req.query, req.params.catagory);
  const totalProducts = await Product.countDocuments(filters);
  const currentPage = Number.parseInt(req.query.page, 10) || 1;
  const itemsPerPage = Number.parseInt(req.query.limit, 10) || 10;
  const totalPages = Math.ceil(totalProducts / itemsPerPage) || 1;

  const features = new APIFeatures(Product.find(filters), req.query)
    .sort()
    .limitFields()
    .pagination();

  const products = await features.query;

  sendViewJson(res, "product", {
    products,
    totalProducts,
    totalPages,
    currentPage,
    itemsPerPage,
    query: req.query,
  });
});

exports.item = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.productId).populate("reviews");
  const products = await Product.find({ catagory: product?.catagory });

  sendViewJson(res, "item", {
    product,
    products,
  });
});

exports.blogs = catchAsync(async (req, res) => {
  const blogs = await Blog.find();

  sendViewJson(res, "blog", {
    blogs,
    totalBlogs: blogs.length,
  });
});

exports.blogInfo = catchAsync(async (req, res) => {
  const blog = await Blog.findById(req.params.blogId);

  sendViewJson(res, "blogInfo", {
    blog,
  });
});

exports.about = catchAsync(async (req, res) => {
  sendViewJson(res, "about");
});

exports.contact = catchAsync(async (req, res) => {
  sendViewJson(res, "contact");
});

exports.login = (req, res) => {
  sendViewJson(res, "login");
};

exports.signup = (req, res) => {
  sendViewJson(res, "signup");
};

exports.forgotpass = (req, res) => {
  sendViewJson(res, "forgotpass");
};

exports.admin = catchAsync(async (req, res) => {
  sendViewJson(res, "admin");
});

exports.adminproduct = catchAsync(async (req, res) => {
  const products = await Product.find().limit(10);

  sendViewJson(res, "adminproduct", {
    products,
  });
});

exports.adminproductcreate = catchAsync(async (req, res) => {
  sendViewJson(res, "adminproductcreate");
});

exports.offline = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  sendViewJson(res, "offlineSell", {
    product,
  });
});

exports.adminorder = catchAsync(async (req, res) => {
  const orders = await Order.find({
    status: { $ne: "delivered" },
  });

  sendViewJson(res, "adminorder", {
    orders,
    totalOrders: orders.length,
  });
});

exports.adminfinance = catchAsync(async (req, res) => {
  sendViewJson(res, "adminfinance");
});

exports.adminreviews = catchAsync(async (req, res) => {
  sendViewJson(res, "adminreviews");
});

exports.adminblogs = catchAsync(async (req, res) => {
  const blogs = await Blog.find();

  sendViewJson(res, "adminblogs", {
    blogs,
    totalBlogs: blogs.length,
  });
});

exports.adminblogscreate = catchAsync(async (req, res) => {
  sendViewJson(res, "blogcreate");
});

exports.adminenquary = catchAsync(async (req, res) => {
  const [unchecked, checked] = await Promise.all([
    Enquary.find({ status: "unchecked" }),
    Enquary.find({ status: "checked" }),
  ]);

  sendViewJson(
    res,
    "adminenquary",
    {
      unchecked,
      checked,
    }
  );
});

exports.scheduleform = catchAsync(async (req, res) => {
  sendViewJson(
    res,
    "adminscheduleForm",
    {
      id: req.params.enquaryId || null,
    }
  );
});

exports.me = catchAsync(async (req, res) => {
  const user = res.locals.user;
  const order = await Order.find({ user: user.id });

  sendViewJson(res, "me", {
    user,
    order,
  });
});

exports.demo = catchAsync(async (req, res) => {
  sendViewJson(res, "adminseeorders.pug");
});

exports.luckydraw = catchAsync(async (req, res) => {
  res.redirect(
    301,
    "https://www.youtube.com/live/_mlrmF41_-s?si=T9iee33oCmyU8I-R"
  );
});
