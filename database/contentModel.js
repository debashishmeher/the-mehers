const mongoose = require("mongoose");

const WebsiteContentSchema = new mongoose.Schema({
  key: {
    type: String,
    default: "home-page",
    unique: true,
  },
  heroBanners: [{
    title: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    }
  }],
  offers: [{
    title: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    discountCode: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    }
  }],
  highlights: [{
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "Truck",
    }
  }]
}, { timestamps: true });

const WebsiteContent = mongoose.model("WebsiteContent", WebsiteContentSchema);
module.exports = WebsiteContent;
