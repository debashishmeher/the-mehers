const Product=require("../database/productModel")
const catchAsync = require("../utility/catchAsync")
const multer=require("multer")
const sharp=require("sharp")
const Review=require("../database/reviewModel")
const Cart=require("../database/cartModel")

// multer configuration------------------------------

const multerstorage=multer.memoryStorage()
const multerfilter=(req,file,cb)=>{
  if(file.mimetype.startsWith("image")){
    cb(null,true)
  }else{
    cb(new AppError("not an image! please check.",400),false)
  }
}
const upload=multer({
    storage:multerstorage,
    fileFilter:multerfilter
  })
exports.productPhoto=upload.array("photo")  
exports.mainphoto=upload.single("mainphoto")

exports.processimg=catchAsync(async(req,res,next)=>{
    const images=req.files;
    console.log("this is processing");
    console.log(images);
    const photoName=[]
    for (let i = 0; i < images.length; i++) {
        const el = images[i];
        const name=`product-${i}-${Date.now()}.jpeg`
        await sharp(el.buffer)
            .resize(500,500)
            .toFormat("jpeg")
            .jpeg({quality:90}).toFile(`./public/image/upload/${name}`)
        console.log("phote created",i);
        photoName.push(name)
    }
    req.body.photo=photoName
    next()
  })
  

exports.processimgmainphoto=catchAsync(async(req,res,next)=>{
  console.log("processing main image");
  console.log(req.file);
  req.body.mainphoto=`main-${Date.now()}.jpeg`
  console.log(req.body.mainphoto);
  await sharp(req.file.buffer)
  .resize(500,625)
  .toFormat("jpeg")
  .jpeg({quality:90}).toFile(`./public/image/product/${req.body.mainphoto}`)
  console.log("process finish");
  next()
})


// create product------------------------------------------------------------------
exports.createproduct=catchAsync(async(req,res,next)=>{
    const product=await Product.create(req.body)
    res.status(201).json({
        status:"success",
        message:"item create successful",
        product
    })
})


// get all products------------------------------------------------------------------
exports.getAllproduct=catchAsync(async(req,res,next)=>{
    const products=await Product.find()
    const number=products.length
    // res.status(200).render("products",{products,number})
    res.status(200).json({
        status:"success",
        products,
        number
    })
})


// get one food---------------------------------------------------------
exports.getOneproduct=catchAsync(async(req,res,next)=>{
    const productId=req.params.productId
    const product=await Product.findById(productId).populate("reviews")
    res.status(200).render("product",{product})
})

// update food------------------------------------------------------------------
exports.updateproduct=catchAsync(async(req,res,next)=>{
    const productId=req.params.productId
    await Product.findByIdAndUpdate(productId,req.body)
    res.status(200).json({
        status:"success",
        message:"product update successful",
    })
})


// delete food----------------------------------------------------------------
exports.deleteproduct=catchAsync(async(req,res,next)=>{
    const productId=req.params.productId
    await Product.findByIdAndDelete(productId)
    await Cart.deleteMany({product:productId})

    res.status(200).json({
        status:"success",
        message:'Product has been deleted'
    })
})


// review-controller-------------------------------------------
exports.createReview=catchAsync(async(req,res,next)=>{
    if(!req.body.user) req.body.user=req.user.id;
    if(!req.body.product) req.body.food=req.params.productId
    const review= await Review.create(req.body)

    res.status(201).json({
        status:"success",
        message:"review post successfully",
        review
    })
})


exports.editReview=catchAsync(async(req,res,next)=>{
    const reviewId=req.params.reviewId
    const review= await Review.findByIdAndUpdate(reviewId,req.body)

    res.status(201).json({
        status:"success",
        message:"review update successfully"
    })
})