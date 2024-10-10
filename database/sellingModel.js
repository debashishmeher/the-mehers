const mongoose = require("mongoose");
const validator = require("validator");

const sellSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "product must be required required"],
  },
  price: {
    type: Number,
    required: [true, "price must be required"],
  },
  discount: {
    type: Number,
    default: 0,
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
  sell: {
    type: Number,
    required: [true, "price must be required"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});


sellSchema.pre(/^find/, function (next) {
  this.populate({
    path: "product",
  });
  next();
});

sellSchema.pre("save", function (next) {
  this.discount = this.price * 1 - this.sell * 1
  next()
})

const Sell = mongoose.model("Sell", sellSchema);
module.exports = Sell;
