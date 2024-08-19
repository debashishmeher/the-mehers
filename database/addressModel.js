const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "user must be required required"],
  },
  home:{
    type:String,
  },
  street:{
    type:String,
    required:[true,"street must be required"]
  },
  city:{
    type:String,
    required:[true,"city must be required"]
  },
  pin:{
    type:Number,
    required:[true,"pin code must be required"]
  }
});

const Address=mongoose.model("Address",addressSchema)
module.exports=Address