const catchAsync = require("../utility/catchAsync");
const Product=require("../database/productModel")
const Enquary=require("../database/enquaryModel")
const Order=require("../database/orderModel")
const Cart=require("../database/cartModel")
const Blog=require("../database/blogsModel")

// controller functions----------------------
exports.home = catchAsync(async (req, res, next) => {
  let user;
  if (res.locals.user) {
    user = res.locals.user;
    console.log(user);
  }
  const products=await Product.find()
  res.status(200).render("home", { user ,products});
});

exports.product=catchAsync(async(req,res,next)=>{
  const products=await Product.find()
  console.log(products);
  res.status(200).render("product",{products})
})
exports.item=catchAsync(async(req,res,next)=>{
  const productId=req.params.productId;
  const product=await Product.findById(productId).populate("reviews")
  const products=await Product.find({catagory:product.catagory})
  console.log(product);
  res.status(200).render("item",{product,products})
})
exports.blogs=catchAsync(async(req,res,next)=>{
  const blogs=await Blog.find() 
  console.log(blogs);
  res.status(200).render("blog",{blogs})
})
exports.blogInfo=catchAsync(async(req,res,next)=>{
  const blog=await Blog.findById(req.params.blogId)
  res.status(200).render("blogInfo",{blog})
})

// login function---------------------------
exports.login=(req,res,next)=>{
  res.status(200).render("login")
}
exports.signup=(req,res,next)=>{
  res.status(200).render("signup")
}
exports.forgotpass=(req,res,next)=>{
  res.status(200).render("forgotpass")
}

// admin function--------------------------
exports.admin=catchAsync(async(req,res,next)=>{
  res.status(200).render("admin")
})
exports.adminproduct=catchAsync(async(req,res,next)=>{
  const products=await Product.find().limit(10)
  res.status(200).render("adminproduct",{products})
})
exports.adminproductcreate=catchAsync(async(req,res,next)=>{
  res.status(200).render("adminproductcreate")
})
exports.adminorder=catchAsync(async(req,res,next)=>{
  res.status(200).render("adminorder")
})
exports.adminfinance=catchAsync(async(req,res,next)=>{
  res.status(200).render("adminfinance")
})
exports.adminreviews=catchAsync(async(req,res,next)=>{
  res.status(200).render("adminreviews")
})

exports.adminblogs=catchAsync(async(req,res,next)=>{
  const blogs=await Blog.find()
  res.status(200).render("adminblogs",{blogs})
})
exports.adminblogscreate=catchAsync(async(req,res,next)=>{
  res.status(200).render("blogcreate")
})
exports.adminenquary=catchAsync(async(req,res,next)=>{
  const unchecked=await Enquary.find({status:"unchecked"})
  const checked=await Enquary.find({status:"checked"})
  res.status(201).render("adminenquary",{unchecked,checked})
})
exports.scheduleform=async(req,res,next)=>{
  res.status(201).render("adminscheduleForm")
}
exports.scheduleform=catchAsync(async(req,res,next)=>{
  const id=req.params.enquaryId
  console.log(id);
  res.status(201).render("adminscheduleForm",{id})
})

// me page--------------
exports.me=catchAsync(async(req,res,next)=>{
  const user=res.locals.user;
  const order= await Order.find({user:user.id})
  res.status(200).render("me",{user,order})
})


// public----------------------------
