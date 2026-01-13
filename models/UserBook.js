const mongoose = require("mongoose");

const userBookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    shelf: {
      type: String,
      enum: ["wantToRead", "currentlyReading", "read"],
      required: true,
    },
    progress: {
      pagesRead: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    startedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxLength: [500, "Notes cannot exceed 500 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries (one user can add same book only once)
userBookSchema.index({ user: 1, book: 1 }, { unique: true });

// Update book totalShelved count
userBookSchema.statics.updateBookShelfCount = async function (bookId) {
  const count = await this.countDocuments({ book: bookId });
  await mongoose.model("Book").findByIdAndUpdate(bookId, {
    totalShelved: count,
  });
};

userBookSchema.post("save", function () {
  this.constructor.updateBookShelfCount(this.book);
});

userBookSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.updateBookShelfCount(doc.book);
  }
});

module.exports = mongoose.model("UserBook", userBookSchema);
