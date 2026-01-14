const mongoose = require("mongoose");

const tutorialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tutorial title is required"],
      trim: true,
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxLength: [500, "Description cannot exceed 500 characters"],
    },
    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      validate: {
        validator: function (v) {
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
        },
        message: "Please provide a valid YouTube URL",
      },
    },
    videoId: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    category: {
      type: String,
      enum: [
        "book-review",
        "reading-tips",
        "author-interview",
        "book-recommendation",
        "other",
      ],
      default: "other",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// Extract video ID from YouTube URL before saving
// tutorialSchema.pre("save", function (next) {
//   if (this.isModified("youtubeUrl")) {
//     const urlPatterns = [
//       /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
//       /youtube\.com\/embed\/([^&\s]+)/,
//     ];

//     for (const pattern of urlPatterns) {
//       const match = this.youtubeUrl.match(pattern);
//       if (match && match[1]) {
//         this.videoId = match[1];
//         this.thumbnail = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
//         break;
//       }
//     }
//   }
//   next();
// });

tutorialSchema.pre("save", function () {
  if (!this.youtubeUrl) {
    return next(new Error("YouTube URL is required"));
  }

  const urlPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/shorts\/([^&\s]+)/,
  ];

  let videoId = null;

  for (const pattern of urlPatterns) {
    const match = this.youtubeUrl.match(pattern);
    if (match && match[1]) {
      videoId = match[1];
      break;
    }
  }

  if (!videoId) {
    return next(new Error("Invalid YouTube URL"));
  }

  this.videoId = videoId;
  this.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return;
});

module.exports = mongoose.model("Tutorial", tutorialSchema);
