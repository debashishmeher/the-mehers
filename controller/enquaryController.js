const Enquary=require("../database/enquaryModel")
const catchAsync = require("../utility/catchAsync");

// create enquary----------------------------
exports.createEnquary=catchAsync(async(req,res,next)=>{
    const enquary=await Enquary.create(req.body)
    res.status(201).json({
        status:"success",
        message:"enquary successful",
        enquary
    })
})

// find all enquary----------------------------------------------

exports.getOneEnquary=catchAsync(async(req,res,next)=>{
    const enquary=await Enquary.findById(req.params.enquaryId)
    res.status(201).render("enquarymng",{enquary})
  })
// update one enquary
exports.deleteEnquary=catchAsync(async(req,res,next)=>{
    const enquary=await Enquary.findById(req.params.enquaryId)
    enquary.status=req.body.status;
    await enquary.save()
    res.status(201).json({
        status:"success",
        message:"enquary update successfully",
        enquaries
    })
})


// delete one enquary------------------------------------------------
exports.updateEnquary=catchAsync(async(req,res,next)=>{
await Enquary.findByIdAndDelete(req.params.enquaryId)
    res.status(201).json({
        status:"success",
        message:"enquary delete successfully",
    })
})