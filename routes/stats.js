const express = require("express");
const router = express.Router();
const { getAdminStats } = require("../controllers/statsController");
const {
  getRecommendations,
  getReadingStats,
} = require("../controllers/recommendationController");
const { protect, authorize } = require("../middleware/auth");

router.get("/admin", protect, authorize("admin"), getAdminStats);
router.get("/recommendations", protect, getRecommendations);
router.get("/reading", protect, getReadingStats);

module.exports = router;
