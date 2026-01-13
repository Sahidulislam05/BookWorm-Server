const Genre = require("../models/Genre");
const Book = require("../models/Book");

// @desc    Get all genres
// @route   GET /api/genres
// @access  Private
exports.getGenres = async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: genres.length,
      genres,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single genre
// @route   GET /api/genres/:id
// @access  Private
exports.getGenre = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    // Get books count for this genre
    const booksCount = await Book.countDocuments({ genre: genre._id });

    res.status(200).json({
      success: true,
      genre: {
        ...genre.toObject(),
        booksCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new genre
// @route   POST /api/genres
// @access  Private/Admin
exports.createGenre = async (req, res) => {
  try {
    const { name, description } = req.body;

    const genre = await Genre.create({
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Genre created successfully",
      genre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update genre
// @route   PUT /api/genres/:id
// @access  Private/Admin
exports.updateGenre = async (req, res) => {
  try {
    let genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    genre = await Genre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Genre updated successfully",
      genre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete genre
// @route   DELETE /api/genres/:id
// @access  Private/Admin
exports.deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    // Check if any books are using this genre
    const booksCount = await Book.countDocuments({ genre: genre._id });

    if (booksCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete genre. ${booksCount} books are using this genre.`,
      });
    }

    await genre.deleteOne();

    res.status(200).json({
      success: true,
      message: "Genre deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
