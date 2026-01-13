const express = require("express");
const router = express.Router();
const {
  getTutorials,
  getTutorial,
  createTutorial,
  updateTutorial,
  deleteTutorial,
} = require("../controllers/tutorialController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, getTutorials)
  .post(protect, authorize("admin"), createTutorial);

router
  .route("/:id")
  .get(protect, getTutorial)
  .put(protect, authorize("admin"), updateTutorial)
  .delete(protect, authorize("admin"), deleteTutorial);

module.exports = router;
