const express = require("express");
const router = express.Router();
const {
  getReviews,
  getBookReviews,
  createReview,
  updateReviewStatus,
  deleteReview,
  getMyReviews,
} = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, authorize("admin"), getReviews)
  .post(protect, createReview);

router.get("/my-reviews", protect, getMyReviews);
router.get("/book/:bookId", protect, getBookReviews);

router.route("/:id").delete(protect, authorize("admin"), deleteReview);

router.put("/:id/status", protect, authorize("admin"), updateReviewStatus);

module.exports = router;
