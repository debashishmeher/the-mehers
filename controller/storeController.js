const Product = require("../database/productModel");
const Category = require("../database/categoryModel");
const WebsiteContent = require("../database/contentModel");
const Sell = require("../database/sellingModel");
const catchAsync = require("../utils/catchAsync");

exports.getStoreHome = catchAsync(async (req, res, next) => {
  // 1. Fetch Website Content (Hero Banners, Offers, Highlights)
  let content = await WebsiteContent.findOne({ key: "home-page" });

  if (!content) {
    // Return default fallback structure if WebsiteContent collection is empty
    content = {
      heroBanners: [
        {
          title: "Elevate Your Premium Style",
          subtitle: "Explore our exclusive handcrafted collections tailored for you.",
          image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop",
          link: "/products",
          active: true,
        },
      ],
      offers: [
        {
          title: "Inaugural Seasonal Launch",
          subtitle: "Use code FIRST50 for 50% discount on initial orders.",
          image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=300&fit=crop",
          link: "/products",
          discountCode: "FIRST50",
          active: true,
        },
      ],
      highlights: [
        {
          title: "Free Express Shipping",
          description: "Complimentary shipping on orders above ₹5000.",
          icon: "Truck",
        },
        {
          title: "Secure Checkout",
          description: "All transactions are fully encrypted and verified.",
          icon: "Shield",
        },
        {
          title: "Handcrafted Luxury",
          description: "Items meticulously constructed by seasoned artisans.",
          icon: "Sparkles",
        },
      ],
    };
  }

  // 2. Fetch Active Categories (sorted by index)
  const categories = await Category.find({ active: { $ne: false } }).sort({ index: 1 });

  // 3. Fetch Top Selling Products
  // Aggregate sales from the Sell collection, count purchases per product, and sort descending
  let topSelling = [];
  try {
    const aggregatedSales = await Sell.aggregate([
      {
        $group: {
          _id: "$product",
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: 10 },
    ]);

    if (aggregatedSales.length > 0) {
      const productIds = aggregatedSales.map((item) => item._id);
      topSelling = await Product.find({ _id: { $in: productIds } });
    }
  } catch (err) {
    console.error("Top selling aggregation failed:", err);
  }

  // Fallback to top-rated products if there are no registered sales yet
  if (topSelling.length === 0) {
    topSelling = await Product.find().sort({ rateing: -1 }).limit(10);
  }

  // 4. Fetch New Arrivals (sorted by creation date descending)
  const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(10);

  // 5. Send Unified JSend Response
  res.status(200).json({
    status: "success",
    data: {
      heroBanners: content.heroBanners?.filter((b) => b.active !== false) || [],
      offers: content.offers?.filter((o) => o.active !== false) || [],
      highlights: content.highlights || [],
      categories,
      topSelling,
      newArrivals,
    },
  });
});
