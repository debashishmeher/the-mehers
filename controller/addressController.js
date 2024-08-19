const Address=require("../database/addressModel")
const catchAsync = require("../utility/catchAsync")


// creating address-----------------------
exports.createAddress=catchAsync(async(req,res,next)=>{
    const user=req.user.id
    req.body.user=user
    await Address.create(req.body)
    res.status(201).json({
        status:"success",
        message:"address created"
    })
})


// getting user address---------------------
exports.getUserAddress=catchAsync(async(req,res,next)=>{
    const userId=req.user.id;
    const address=await Address.find({user:userId})
    res.status(200).json({
        status:"success",
        address
    })
})


// delete user address--------------------------
exports.deleteUserAddress=catchAsync(async(req,res,next)=>{
    const userId=req.user.id;
    await Address.findOneAndDelete({user:userId})
    res.status(200).json({
        status:"success",
        message:"address delete successfully"
    })
})


// patch address------------------------------------
exports.deleteUserAddress=catchAsync(async(req,res,next)=>{
    const userId=req.user.id;
    await Address.findOneAndUpdate({user:userId},req.body)
    res.status(200).json({
        status:"success",
        message:"address update successfully"
    })
})
