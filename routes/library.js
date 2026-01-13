const express = require("express");
const router = express.Router();
const {
  getMyLibrary,
  addToShelf,
  updateShelf,
  removeFromShelf,
} = require("../controllers/userBookController");
const { protect } = require("../middleware/auth");

router.route("/").get(protect, getMyLibrary).post(protect, addToShelf);

router.route("/:id").put(protect, updateShelf).delete(protect, removeFromShelf);

module.exports = router;
