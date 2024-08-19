const User = require("../database/userModel");
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/AppError");
const multer=require("multer")
const sharp=require("sharp");
const { log } = require("util");

exports.getalluser = catchAsync(async (req, res, next) => {
  const newuser = await User.find();

  res.status(200).json({
    status: "success",
    newuser,
  });
});


const multerstorage=multer.memoryStorage()
const multerfilter=(req,file,cb)=>{
  if(file.mimetype.startsWith("image")){
    cb(null,true)
  }else{
    cb(new AppError("not an image! please check.",400),false)
  }
}

const userUpload=multer({
  storage:multerstorage,
  fileFilter:multerfilter
})

exports.userPhoto=userUpload.single("photo")
exports.processimg=catchAsync(async(req,res,next)=>{
  console.log("processing image");
  console.log(req.file);
  req.body.photo=`user-${req.user.id}.jpeg`
  console.log(req.body.photo);
  await sharp(req.file.buffer)
  .toFormat("jpeg")
  .jpeg({quality:90}).toFile(`./public/image/user/${req.body.photo}`)
  console.log("process finish");
  next()
})

exports.updateUser=catchAsync(async(req,res,next)=>{
  const userId=req.user.id;
  const user= await User.findByIdAndUpdate(userId,req.body)
  res.status(201).json({status:"success",message:"user data update successfully",user})
})

