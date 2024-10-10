const Sell = require("../database/sellingModel")
const Product = require("../database/productModel")
const catchAsync = require("../utility/catchAsync");
const AppError = require("../utility/AppError");

exports.sellCreate = catchAsync(async (req, res, next) => {
    req.body.product = req.params.productId;
    const product = await Product.findById(req.params.productId);
    if(product.quantity <=0){
        return next(new AppError("item  quantity is not enough",404))
    }
    req.body.price = product.price
    product.quantity = product.quantity * 1 - 1
    product.save()
    const selling = await Sell.create(req.body)
    res.status(200).json({
        status: "success",
        message: "product sell"
    })
})