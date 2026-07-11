const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const WebsiteContent = require("../database/contentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Configure Multer Memory Storage
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only image files.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadContentPhoto = upload.single("image");

// Resize and process content banners/offers
exports.processContentPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Create static content directory if missing
  const contentDir = path.join(__dirname, "../public/image/content");
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  const filename = `content-${Date.now()}.jpeg`;
  const filePath = path.join(contentDir, filename);

  // Resize to optimized dimensions (e.g. 1200px width)
  await sharp(req.file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .toFormat("jpeg")
    .jpeg({ quality: 85 })
    .toFile(filePath);

  const baseUrl = process.env.URL ? (process.env.URL.endsWith("/") ? process.env.URL : `${process.env.URL}/`) : "http://localhost:8000/";
  req.body.imageUrl = `${baseUrl}image/content/${filename}`;

  next();
});

// Upload image endpoint callback
exports.uploadImage = (req, res) => {
  if (!req.body.imageUrl) {
    return res.status(400).json({
      status: "fail",
      message: "No image file uploaded."
    });
  }

  res.status(200).json({
    status: "success",
    url: req.body.imageUrl
  });
};

// Get home page content structure
exports.getHomeContent = catchAsync(async (req, res, next) => {
  let content = await WebsiteContent.findOne({ key: "home-page" });

  // Create default model content if missing
  if (!content) {
    content = await WebsiteContent.create({
      key: "home-page",
      heroBanners: [
        {
          title: "Elevate Your Premium Style",
          subtitle: "Explore our exclusive handcrafted collections tailored for you.",
          image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop",
          link: "/products",
          active: true
        }
      ],
      offers: [
        {
          title: "Inaugural Seasonal Launch",
          subtitle: "Use code FIRST50 for 50% discount on initial orders.",
          image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=300&fit=crop",
          link: "/products",
          discountCode: "FIRST50",
          active: true
        }
      ],
      highlights: [
        {
          title: "Free Express Shipping",
          description: "Complimentary shipping on orders above ₹5000.",
          icon: "Truck"
        },
        {
          title: "Secure Checkout",
          description: "All transactions are fully encrypted and verified.",
          icon: "Shield"
        },
        {
          title: "Handcrafted Luxury",
          description: "Items meticulously constructed by seasoned artisans.",
          icon: "Sparkles"
        }
      ]
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      content
    }
  });
});

// Save custom home page configurations
exports.updateHomeContent = catchAsync(async (req, res, next) => {
  const content = await WebsiteContent.findOneAndUpdate(
    { key: "home-page" },
    req.body,
    {
      new: true,
      runValidators: true,
      upsert: true
    }
  );

  res.status(200).json({
    status: "success",
    message: "Website homepage content saved successfully.",
    data: {
      content
    }
  });
});
