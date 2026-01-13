const User = require("../models/User");
const Book = require("../models/Book");
const Genre = require("../models/Genre");
const Review = require("../models/Review");
const UserBook = require("../models/UserBook");

// @desc    Get admin dashboard stats
// @route   GET /api/stats/admin
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalGenres = await Genre.countDocuments();
    const pendingReviews = await Review.countDocuments({ status: "pending" });
    const totalReviews = await Review.countDocuments();

    // Books per genre
    const booksPerGenre = await Book.aggregate([
      {
        $group: {
          _id: "$genre",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "genres",
          localField: "_id",
          foreignField: "_id",
          as: "genreInfo",
        },
      },
      {
        $unwind: "$genreInfo",
      },
      {
        $project: {
          genre: "$genreInfo.name",
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Top rated books
    const topRatedBooks = await Book.find()
      .populate("genre", "name")
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(5)
      .select("title author coverImage averageRating totalRatings");

    // Most shelved books
    const mostShelvedBooks = await Book.find()
      .populate("genre", "name")
      .sort({ totalShelved: -1 })
      .limit(5)
      .select("title author coverImage totalShelved");

    // Recent users
    const recentUsers = await User.find()
      .select("name email photo role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // User role distribution
    const userRoles = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly user registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalBooks,
          totalGenres,
          totalReviews,
          pendingReviews,
        },
        booksPerGenre,
        topRatedBooks,
        mostShelvedBooks,
        recentUsers,
        userRoles,
        monthlyUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
