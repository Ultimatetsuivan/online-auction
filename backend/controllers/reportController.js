const asyncHandler = require("express-async-handler");
const Report = require("../models/Report");

const createReport = asyncHandler(async (req, res) => {
  const reporter = req.user._id;
  const { productId, userId, type, description } = req.body;

  if (!type || !description) {
    return res.status(400).json({ message: "type and description are required" });
  }

  const report = await Report.create({
    reporter,
    product: productId || null,
    user: userId || null,
    type,
    description
  });

  res.status(201).json({ success: true, report });
});

const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({})
    .populate("reporter", "name email")
    .populate("user", "name email")
    .populate("product", "title");

  res.status(200).json({ reports });
});

const resolveReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionNote } = req.body;

  const report = await Report.findById(id);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  report.status = "resolved";
  report.resolutionNote = resolutionNote || "";
  report.resolvedBy = req.user._id;
  report.resolvedAt = new Date();

  await report.save();

  res.status(200).json({ success: true, report });
});

module.exports = {
  createReport,
  getReports,
  resolveReport
};
