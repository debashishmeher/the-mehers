const mongoose=require("mongoose")

const productSchma=new mongoose.Schema({
    name:{
        type:String,
        unique:[true,"item name must be unique"],
        required:[true,"item name must be required"]
    },
    photo:[],
    mainphoto:{
        type:String,
        required:[true,"theme photo must be required"]
    },
    price:{
        type:Number,
        required:[true,"item price must be required"]
    },
    purchase:{
        type:Number,
        required:[true,"item purchase must be required"]
    },
    discount:{
        type:Number,
        min:0,
        max:100
    },
    catagory:{
        type:String,
        default:"saree"
    },
    code:{
        type:String,
        default:"uncoded"
    },
    quantity:{
        type:Number,
        default:1
    },
    weight:{
        type:Number,
    },
    desc:{
        type:String,
        default:"Our Spaghetti Aglio e Olio is a timeless Italian favorite. Al dente spaghetti tossed in fragrant garlic-infused olive oil, red pepper flakes, and fresh parsley. Simple, flavorful, and oh-so-satisfying!"
    },
    rateing:{
        type:Number,
        min:1,
        max:5,
        default:1
    }
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  })

  productSchma.virtual("reviews", {
    ref: "Review",
    foreignField: "product",
    localField: "_id",
  });

const Product=mongoose.model("Product",productSchma)
module.exports=Product;