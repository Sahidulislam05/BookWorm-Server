const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxLength: [100, "Author name cannot exceed 100 characters"],
    },
    genre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
      required: [true, "Genre is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is required"],
    },
    totalPages: {
      type: Number,
      default: 0,
    },
    publicationYear: {
      type: Number,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalShelved: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate reviews
bookSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "book",
});

// Indexes for better search performance
bookSchema.index({ title: "text", author: "text" });
bookSchema.index({ genre: 1 });
bookSchema.index({ averageRating: -1 });

module.exports = mongoose.model("Book", bookSchema);
