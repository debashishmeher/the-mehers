const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "user must be required required"],
  },
  home: {
    type: String,
  },
  street: {
    type: String,
    required: [true, "street must be required"],
  },
  city: {
    type: String,
    required: [true, "city must be required"],
  },
  pin: {
    type: Number,
    required: [true, "pin code must be required"],
  },
  phone: {
    type: Number,
    required: [true, "phone no must be required"],
    validate: {
      validator: function (val) {
        return val.toString().length === 10;
      },
      message: (val) => `${val.value} has to be 10 digits`,
    },
  },
});

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
