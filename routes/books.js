const express = require("express");
const router = express.Router();
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, getBooks)
  .post(protect, authorize("admin"), createBook);

router
  .route("/:id")
  .get(protect, getBook)
  .put(protect, authorize("admin"), updateBook)
  .delete(protect, authorize("admin"), deleteBook);

module.exports = router;
