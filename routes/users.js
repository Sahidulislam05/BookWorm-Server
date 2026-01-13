const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUserRole,
  updateReadingGoal,
  followUser,
  unfollowUser,
  getActivityFeed,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, authorize("admin"), getUsers);
router.get("/activity-feed", protect, getActivityFeed);
router.put("/reading-goal", protect, updateReadingGoal);

router.get("/:id", protect, authorize("admin"), getUser);
router.put("/:id/role", protect, authorize("admin"), updateUserRole);

router
  .route("/:id/follow")
  .post(protect, followUser)
  .delete(protect, unfollowUser);

module.exports = router;
