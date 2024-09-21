const mongoose = require("mongoose");
const validator = require("validator");


const OrderSchema = new mongoose.Schema({
  product: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: [true, "product must be required required"],
  
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "user must be required required"],
  },
  address: {
    type: "string",
  },
  price: {
    type: String,
    required: [true, "price must be required"],
  },
  discount: {
    type: Number,
    min: 0,
    default: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ["ordered", "initiate", "on-way", "delivered"],
    default: "ordered",
  },
  payType: {
    type: String,
    enum: ["offline", "online"],
    default: "offline",
  },
  phone: {
    type: Number,
    // required: [true, "phone no must be required"],
    validate: {
      validator: function (val) {
        return val.toString().length === 10;
      },
      message: (val) => `${val.value} has to be 10 digits`,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});


OrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
  });
  next();
});
OrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "product",
  });
  next();
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
