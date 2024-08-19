const mongoose=require("mongoose");

const notificationSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
    },
    notification:{
        type:Object,
        required:[true,"notification subscription needed.."]
    }
})

const Notification=mongoose.model("Notification",notificationSchema)
module.exports=Notification