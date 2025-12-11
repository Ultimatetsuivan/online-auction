const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { 
  getBiddingHistory, 
  placeBid, 
  sellProduct, 
  checkUserBidStatus,
  getMyBids,
  getMyWins,
  getMyLosses
} = require("../controllers/biddingController");

const router = express.Router();

router.get("/my", protect, getMyBids);
router.get("/my-wins", protect, getMyWins);
router.get("/my-losses", protect, getMyLosses);
router.get("/:productId", getBiddingHistory);
router.post("/", protect, placeBid);
router.post("/sell", protect, sellProduct);
router.get('/check-bid-status/:productId', protect, checkUserBidStatus);
module.exports = router;
