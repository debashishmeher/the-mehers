const mongoose = require("mongoose");

const reviewsSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "review must be required"],
    },
    rating: {
      type: Number,
      min: [1, "rating must have minimun 1 star"],
      max: [5, "rating must have maximum 5 star"],
      required: [true, "rating must be required"],
    },
    updateDate: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user must be required"],
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "review must be refer to a Product"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewsSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name",
  });

  next();
});

const Review= mongoose.model("Review", reviewsSchema);
module.exports =Review
