const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  quantity: {
    type: Number,
    default: 1,
  },
  addedAt:{
    type:Date,
    default:Date.now()
  }
});


cartSchema.pre(/^find/, function (next) {
    this.populate({
      path: "product",
    });
    next();
  });
cartSchema.pre(/^find/, function (next) {
    this.populate({
      path: "user",
    });
    next();
  });

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
