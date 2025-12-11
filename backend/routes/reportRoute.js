const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const { 
  createReport, 
  getReports, 
  resolveReport 
} = require("../controllers/reportController");

const router = express.Router();

// User-submitted reports
router.post("/report", protect, createReport);

// Admin review/resolve
router.get("/admin/reports", protect, admin, getReports);
router.post("/admin/reports/:id/resolve", protect, admin, resolveReport);

module.exports = router;
