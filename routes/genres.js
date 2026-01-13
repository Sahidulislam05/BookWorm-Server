const express = require("express");
const router = express.Router();
const {
  getGenres,
  getGenre,
  createGenre,
  updateGenre,
  deleteGenre,
} = require("../controllers/genreController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, getGenres)
  .post(protect, authorize("admin"), createGenre);

router
  .route("/:id")
  .get(protect, getGenre)
  .put(protect, authorize("admin"), updateGenre)
  .delete(protect, authorize("admin"), deleteGenre);

module.exports = router;
