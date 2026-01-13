const UserBook = require("../models/UserBook");
const Activity = require("../models/Activity");
const Book = require("../models/Book");

// @desc    Get user's library (all shelves)
// @route   GET /api/library
// @access  Private
exports.getMyLibrary = async (req, res) => {
  try {
    const { shelf } = req.query;

    let query = { user: req.user.id };

    if (shelf) {
      query.shelf = shelf;
    }

    const userBooks = await UserBook.find(query)
      .populate("book")
      .sort({ createdAt: -1 });

    // Group by shelf
    const library = {
      wantToRead: [],
      currentlyReading: [],
      read: [],
    };

    userBooks.forEach((ub) => {
      if (ub.shelf === "wantToRead") {
        library.wantToRead.push(ub);
      } else if (ub.shelf === "currentlyReading") {
        library.currentlyReading.push(ub);
      } else if (ub.shelf === "read") {
        library.read.push(ub);
      }
    });

    res.status(200).json({
      success: true,
      library,
      stats: {
        wantToRead: library.wantToRead.length,
        currentlyReading: library.currentlyReading.length,
        read: library.read.length,
        total: userBooks.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add book to shelf
// @route   POST /api/library
// @access  Private
exports.addToShelf = async (req, res) => {
  try {
    const { book, shelf, pagesRead } = req.body;

    // Check if book exists
    const bookExists = await Book.findById(book);
    if (!bookExists) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if already in library
    const existing = await UserBook.findOne({
      user: req.user.id,
      book,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Book already in your library. Update instead.",
      });
    }

    // Calculate progress percentage
    let percentage = 0;
    if (pagesRead && bookExists.totalPages) {
      percentage = Math.min((pagesRead / bookExists.totalPages) * 100, 100);
    }

    const userBook = await UserBook.create({
      user: req.user.id,
      book,
      shelf,
      progress: {
        pagesRead: pagesRead || 0,
        percentage,
      },
      startedAt: shelf === "currentlyReading" ? new Date() : null,
      finishedAt: shelf === "read" ? new Date() : null,
    });

    // Create activity
    await Activity.create({
      user: req.user.id,
      type: "added-to-shelf",
      book,
      shelf,
    });

    const populatedUserBook = await UserBook.findById(userBook._id).populate(
      "book"
    );

    res.status(201).json({
      success: true,
      message: "Book added to shelf successfully",
      userBook: populatedUserBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update book shelf or progress
// @route   PUT /api/library/:id
// @access  Private
exports.updateShelf = async (req, res) => {
  try {
    let userBook = await UserBook.findById(req.params.id);

    if (!userBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found in your library",
      });
    }

    // Check ownership
    if (userBook.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this entry",
      });
    }

    const { shelf, pagesRead, notes } = req.body;
    const bookData = await Book.findById(userBook.book);

    // Update shelf and timestamps
    if (shelf) {
      userBook.shelf = shelf;

      if (shelf === "currentlyReading" && !userBook.startedAt) {
        userBook.startedAt = new Date();
        await Activity.create({
          user: req.user.id,
          type: "started-reading",
          book: userBook.book,
        });
      }

      if (shelf === "read") {
        userBook.finishedAt = new Date();
        userBook.progress.percentage = 100;
        userBook.progress.pagesRead = bookData?.totalPages || 0;
        await Activity.create({
          user: req.user.id,
          type: "finished-book",
          book: userBook.book,
        });
      }
    }

    // Update progress
    if (pagesRead !== undefined) {
      userBook.progress.pagesRead = pagesRead;
      if (bookData?.totalPages) {
        userBook.progress.percentage = Math.min(
          (pagesRead / bookData.totalPages) * 100,
          100
        );
      }
    }

    if (notes !== undefined) {
      userBook.notes = notes;
    }

    await userBook.save();

    const updated = await UserBook.findById(userBook._id).populate("book");

    res.status(200).json({
      success: true,
      message: "Library updated successfully",
      userBook: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove book from shelf
// @route   DELETE /api/library/:id
// @access  Private
exports.removeFromShelf = async (req, res) => {
  try {
    const userBook = await UserBook.findById(req.params.id);

    if (!userBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found in your library",
      });
    }

    // Check ownership
    if (userBook.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this entry",
      });
    }

    await userBook.deleteOne();

    res.status(200).json({
      success: true,
      message: "Book removed from shelf successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
