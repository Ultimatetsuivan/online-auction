const express = require("express");
const {
  postProduct,
  getAllProducts,
  deleteProduct,
  updateProduct,
  getAllProductsAdmin,
  getAllProductsUser,
  getProduct,
  getAllSoldProduct,
  getAllAvailableProducts,
  getMyActiveAuctions,
  getMyScheduledAuctions,
  getMyEndedUnsoldAuctions,
  getMySoldAuctions,
  buyNowProduct,
  sellNowToTopBidder,
  getSimilarProducts,
  getRecommendedProducts,
  // New vehicle endpoints
  updateVehicleInfo,
  updateSellerDescription,
  decodeVIN,
  requestVehicleHistory,
  // AI category suggestion
  suggestCategory
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");
const { upload } = require("../utils/fileUpload");

const router = express.Router();

router.get("/products", getAllAvailableProducts);
router.get("/recommended", getRecommendedProducts);

// Image upload endpoint (for identity verification, etc.)
router.post("/upload", protect, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      url: `/uploads/${req.file.filename}`,
      publicId: req.file.filename,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post("/", protect, upload.array("images", 20), postProduct);
router.get("/my", protect, getAllProductsUser);
router.get("/my/active", protect, getMyActiveAuctions);
router.get("/my/scheduled", protect, getMyScheduledAuctions);
router.get("/my/ended-unsold", protect, getMyEndedUnsoldAuctions);
router.get("/my/sold", protect, getMySoldAuctions);
router.post("/:productId/buy-now", protect, buyNowProduct);
router.post("/:productId/sell-now", protect, sellNowToTopBidder);
router.get("/getAllProducts",  getAllProducts);
router.get("/sold",  getAllSoldProduct);
router.get("/user/:userId", protect, admin, getAllProductsAdmin);

router.delete("/:id", protect, deleteProduct);
router.put("/:id", protect, upload.single("image"), updateProduct);
router.get("/:id/similar", getSimilarProducts);
router.get("/:id",  getProduct);

// ===== NEW: Vehicle-Specific Routes =====
router.put("/:id/vehicle-info", protect, updateVehicleInfo);
router.put("/:id/seller-description", protect, updateSellerDescription);
router.post("/:id/vehicle-history", protect, requestVehicleHistory);
router.get("/vin/decode/:vin", decodeVIN);

// ===== AI Category Suggestion =====
router.post("/suggest-category", suggestCategory);

module.exports = router;
