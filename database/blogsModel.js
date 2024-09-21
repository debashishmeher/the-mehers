const mongoose=require("mongoose")

const blogSchema=new mongoose.Schema({
    blog:{
        type:String,
        required:[true,"blog content must be required"]
    },
    title:{
        type:String,
        required:[true,"title must be required"]
    },
    image:{
        type:String,
        required:[true,"blog image content must be required"]
    },
    desc:{
        type:String,
        required:[true,"blog desc. must be required"]  
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
})
const Blog=mongoose.model("Blog",blogSchema)
module.exports=Blog