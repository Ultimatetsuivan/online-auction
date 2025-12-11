const express = require("express");
const { createCategory, getAllCategories, getCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, admin, createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategory); // Public - allow users to view category details
router.delete("/:id", protect, admin, deleteCategory);

module.exports = router;