const Enquary=require("../database/enquaryModel");
const Schedule = require("../database/sechduleModel");
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
    const schedules=await Schedule.find({enquary:req.params.enquaryId})
    console.log(schedules);
    
    res.status(201).render("enquarymng",{enquary,schedules})
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