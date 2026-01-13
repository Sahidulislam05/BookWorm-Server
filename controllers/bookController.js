const Book = require("../models/Book");
const Review = require("../models/Review");
const UserBook = require("../models/UserBook");
const { uploadToCloudinary } = require("../config/cloudinary");

// @desc    Get all books with filters
// @route   GET /api/books
// @access  Private
exports.getBooks = async (req, res) => {
  try {
    const {
      search,
      genre,
      minRating,
      maxRating,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    // Build query
    let query = {};

    // Search by title or author
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by genre (supports multiple genres)
    if (genre) {
      const genres = genre.split(",");
      query.genre = { $in: genres };
    }

    // Filter by rating range
    if (minRating || maxRating) {
      query.averageRating = {};
      if (minRating) query.averageRating.$gte = Number(minRating);
      if (maxRating) query.averageRating.$lte = Number(maxRating);
    }

    // Sort options
    let sortOption = {};
    if (sort === "rating") {
      sortOption = { averageRating: -1 };
    } else if (sort === "shelved") {
      sortOption = { totalShelved: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const books = await Book.find(query)
      .populate("genre", "name slug")
      .sort(sortOption)
      .limit(Number(limit))
      .skip(skip);

    const total = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Private
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("genre", "name slug description")
      .populate({
        path: "reviews",
        match: { status: "approved" },
        populate: { path: "user", select: "name photo" },
      });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      genre,
      description,
      totalPages,
      publicationYear,
      isbn,
    } = req.body;

    // Upload cover image
    if (!req.files || !req.files.coverImage) {
      return res.status(400).json({
        success: false,
        message: "Please upload a cover image",
      });
    }

    const result = await uploadToCloudinary(
      req.files.coverImage,
      "bookworm/books"
    );

    const book = await Book.create({
      title,
      author,
      genre,
      description,
      coverImage: result.url,
      totalPages,
      publicationYear,
      isbn,
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const updateData = { ...req.body };

    // Upload new cover image if provided
    if (req.files && req.files.coverImage) {
      const result = await uploadToCloudinary(
        req.files.coverImage,
        "bookworm/books"
      );
      updateData.coverImage = result.url;
    }

    book = await Book.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await Review.deleteMany({ book: req.params.id });

    await UserBook.deleteMany({ book: req.params.id });

    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
