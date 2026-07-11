const Enquary = require("../database/enquaryModel");
const Schedule = require("../database/sechduleModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/APIFeatures");

const buildEnquiryFilters = (query) => {
  const { page, limit, sort, fields, search, ...restFilters } = query;
  const filters = { ...restFilters };

  if (search && search.trim() !== "") {
    const searchRegex = { $regex: search.trim(), $options: "i" };

    filters.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  return filters;
};

exports.createEnquary = catchAsync(async (req, res) => {
  const enquary = await Enquary.create(req.body);

  res.status(201).json({
    status: "success",
    message: "enquiry created successfully",
    data: {
      enquary,
    },
  });
});

exports.getAllEnquiry = catchAsync(async (req, res) => {
  const filters = buildEnquiryFilters(req.query);
  const totalLeads = await Enquary.countDocuments(filters);
  const currentPage = Number.parseInt(req.query.page, 10) || 1;
  const itemsPerPage = Number.parseInt(req.query.limit, 10) || 10;
  const totalPages = Math.ceil(totalLeads / itemsPerPage) || 1;

  const features = new APIFeatures(Enquary.find(filters), req.query)
    .sort()
    .limitFields()
    .pagination();

  const leads = await features.query;

  res.status(200).json({
    status: "success",
    data: {
      leads,
      totalLeads,
      totalPages,
      currentPage,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  });
});

exports.getOneEnquary = catchAsync(async (req, res) => {
  const enquary = await Enquary.findById(req.params.enquaryId);
  const schedules = await Schedule.find({ enquary: req.params.enquaryId });

  res.status(200).json({
    status: "success",
    data: {
      enquary,
      schedules,
    },
  });
});

exports.updateEnquary = catchAsync(async (req, res) => {
  const enquary = await Enquary.findByIdAndUpdate(req.params.enquaryId, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "enquiry updated successfully",
    data: {
      enquary,
    },
  });
});

exports.deleteEnquary = catchAsync(async (req, res) => {
  await Enquary.findByIdAndDelete(req.params.enquaryId);
  await Schedule.deleteMany({ enquary: req.params.enquaryId });

  res.status(200).json({
    status: "success",
    message: "enquiry deleted successfully",
  });
});
