const mongoose = require("mongoose");
const validator = require("validator");

const enquarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "name must be required"],
  },
  email: {
    type: String,
    validate: [validator.isEmail, "please provide a valid email"],
  },
  phone: {
    type: Number,
    required: [true, "number must be required"],
    unique:[true,"this number already exist"],
    minLength: [10, "phone number must have 10 digits"],
    maxLength: [10, "phone number must have 10 digits"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  status:{
    type:String,
    enum:["checked","unchecked"],
    default:"unchecked"
  },
  type:{
    type:String,
    enum:["cold","warm","hot"],
    default:"cold"
  }
});


const Enquary = mongoose.model("Enquary",enquarySchema);
module.exports = Enquary;
