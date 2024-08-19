const Cart=require("../database/cartModel")
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/AppError");


// adding items in cart----------------------
exports.addItem=catchAsync(async(req,res,next)=>{
    if(!req.body.user) req.body.user=req.user.id;
    if(!req.body.product) req.body.product=req.params.productId;
    const item=await Cart.create(req.body)
    res.status(201).json({
        status:"success",
        message:"item added to cart",
        item
    })
})

// getting all cart items------------------------------------
exports.getUserItems=catchAsync(async(req,res,next)=>{
    const userId=req.user.id;
    const items=await Cart.find({user:userId})
    let total=0;
    let sipping=40;
    items.forEach(el => {
        total=total + (el.product.price * el.quantity)
    });
    if(total >= 5000){
        sipping=0
    }
    res.status(200).render("cart",{items,total,sipping})
})

// update item quantity-------------------------------
exports.updateUserItems=catchAsync(async(req,res,next)=>{
    const itemId=req.params.itemId;
    const items=await Cart.findById(itemId)
    items.quantity=req.body.quantity;
    await items.save()
    res.status(200).json({
        status:"success",
        message:"quantaty update successful",
        items
    })
})


// delete cart items --------------------------------
exports.deleteUserItems=catchAsync(async(req,res,next)=>{
    const itemId=req.params.itemId;
    await Cart.findByIdAndDelete(itemId)

    res.status(200).json({
        status:"success",
        message:"quantaty deleted successful",
    })
})