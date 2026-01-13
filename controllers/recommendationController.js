const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Review = require("../models/Review");

// @desc    Get personalized recommendations
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's read books
    const readBooks = await UserBook.find({
      user: userId,
      shelf: "read",
    }).populate("book");

    let recommendations = [];

    if (readBooks.length >= 3) {
      // User has read 3+ books - use advanced recommendations

      // 1. Get favorite genres (most read)
      const genreCounts = {};
      readBooks.forEach((ub) => {
        const genreId = ub.book.genre.toString();
        genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
      });

      const favoriteGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genreId]) => genreId);

      // 2. Get user's average rating
      const userReviews = await Review.find({ user: userId });
      const avgUserRating =
        userReviews.length > 0
          ? userReviews.reduce((sum, r) => sum + r.rating, 0) /
            userReviews.length
          : 4;

      // 3. Get books user hasn't read
      const readBookIds = readBooks.map((ub) => ub.book._id);

      // 4. Find recommendations based on favorite genres and high ratings
      const genreBasedBooks = await Book.find({
        genre: { $in: favoriteGenres },
        _id: { $nin: readBookIds },
        averageRating: { $gte: avgUserRating - 0.5 },
      })
        .populate("genre")
        .sort({ averageRating: -1, totalShelved: -1 })
        .limit(12);

      recommendations = genreBasedBooks.map((book) => ({
        book,
        reason: `Matches your preference for ${book.genre.name}`,
      }));

      // 5. If not enough, add popular books from other genres
      if (recommendations.length < 12) {
        const popularBooks = await Book.find({
          _id: {
            $nin: [...readBookIds, ...recommendations.map((r) => r.book._id)],
          },
          averageRating: { $gte: 4 },
        })
          .populate("genre")
          .sort({ totalShelved: -1, averageRating: -1 })
          .limit(12 - recommendations.length);

        popularBooks.forEach((book) => {
          recommendations.push({
            book,
            reason: "Popular among readers",
          });
        });
      }
    } else {
      // User has read <3 books - show popular and random books

      // Get popular books (top rated + most shelved)
      const popularBooks = await Book.find({
        averageRating: { $gte: 4 },
        totalShelved: { $gt: 0 },
      })
        .populate("genre")
        .sort({ averageRating: -1, totalShelved: -1 })
        .limit(10);

      recommendations = popularBooks.map((book) => ({
        book,
        reason: "Highly rated by readers",
      }));

      // Add some random books to discover
      const readBookIds = readBooks.map((ub) => ub.book._id);
      const randomBooks = await Book.aggregate([
        {
          $match: {
            _id: {
              $nin: [...readBookIds, ...recommendations.map((r) => r.book._id)],
            },
          },
        },
        { $sample: { size: 8 } },
      ]);

      for (const book of randomBooks) {
        const populatedBook = await Book.findById(book._id).populate("genre");
        recommendations.push({
          book: populatedBook,
          reason: "Discover something new",
        });
      }
    }

    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
      userStats: {
        booksRead: readBooks.length,
        recommendationMode:
          readBooks.length >= 3 ? "personalized" : "discovery",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get reading stats for dashboard
// @route   GET /api/stats/reading
// @access  Private
exports.getReadingStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    // Get all user books
    const allBooks = await UserBook.find({ user: userId }).populate("book");

    // Books read this year
    const booksReadThisYear = allBooks.filter(
      (ub) =>
        ub.shelf === "read" &&
        ub.finishedAt &&
        new Date(ub.finishedAt).getFullYear() === currentYear
    );

    // Total pages read
    const totalPages = booksReadThisYear.reduce((sum, ub) => {
      return sum + (ub.book?.totalPages || 0);
    }, 0);

    // Average rating
    const userReviews = await Review.find({ user: userId });
    const avgRating =
      userReviews.length > 0
        ? (
            userReviews.reduce((sum, r) => sum + r.rating, 0) /
            userReviews.length
          ).toFixed(1)
        : 0;

    // Genre breakdown
    const genreCount = {};
    allBooks
      .filter((ub) => ub.shelf === "read")
      .forEach((ub) => {
        if (ub.book?.genre) {
          const genreName = ub.book.genre.name || "Unknown";
          genreCount[genreName] = (genreCount[genreName] || 0) + 1;
        }
      });

    // Monthly reading (books per month)
    const monthlyReading = Array(12).fill(0);
    booksReadThisYear.forEach((ub) => {
      if (ub.finishedAt) {
        const month = new Date(ub.finishedAt).getMonth();
        monthlyReading[month]++;
      }
    });

    // Reading streak (simplified)
    const readBooks = allBooks
      .filter((ub) => ub.shelf === "read")
      .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));

    let streak = 0;
    if (readBooks.length > 0) {
      const today = new Date();
      const lastRead = new Date(readBooks[0].finishedAt);
      const daysDiff = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 7) {
        streak = readBooks.filter((ub) => {
          const bookDate = new Date(ub.finishedAt);
          const diff = Math.floor((today - bookDate) / (1000 * 60 * 60 * 24));
          return diff <= 30;
        }).length;
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        booksReadThisYear: booksReadThisYear.length,
        totalPages,
        averageRating: avgRating,
        readingStreak: streak,
        favoriteGenre:
          Object.keys(genreCount).length > 0
            ? Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0][0]
            : "None",
        genreBreakdown: genreCount,
        monthlyReading,
        totalBooksRead: allBooks.filter((ub) => ub.shelf === "read").length,
        currentlyReading: allBooks.filter(
          (ub) => ub.shelf === "currentlyReading"
        ).length,
        wantToRead: allBooks.filter((ub) => ub.shelf === "wantToRead").length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
