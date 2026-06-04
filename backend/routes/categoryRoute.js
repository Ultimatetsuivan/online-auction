const express = require("express");
const { createCategory, getAllCategories, getCategory, deleteCategory, updateFieldSchema } = require("../controllers/categoryController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, admin, createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategory);
router.put("/:id/schema", protect, admin, updateFieldSchema);
router.delete("/:id", protect, admin, deleteCategory);

module.exports = router;