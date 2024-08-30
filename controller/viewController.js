const catchAsync = require("../utility/catchAsync");
const Product=require("../database/productModel")
const Enquary=require("../database/enquaryModel")


// controller functions----------------------


// login function---------------------------
exports.login=(req,res,next)=>{
  res.status(200).render("login")
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