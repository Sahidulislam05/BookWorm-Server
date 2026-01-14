const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const errorHandler = require("./middleware/errorHandler");

// Load env vars
dotenv.config();
const app = express();

// Connect to database

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "tmp/",
  })
);

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/books", require("./routes/books"));
app.use("/api/genres", require("./routes/genres"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/library", require("./routes/library"));
app.use("/api/users", require("./routes/users"));
app.use("/api/tutorials", require("./routes/tutorials"));
app.use("/api/stats", require("./routes/stats"));

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BookWorm API is running",
  });
});

// Error handler
app.use(errorHandler);

// const PORT = process.env.PORT || 5000;
// const server = app.listen(PORT, () => {
//   console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// });

module.exports = app;

// Handle unhandled promise rejections

// process.on("unhandledRejection", (err, promise) => {
//   console.log(`Error: ${err.message}`);
//   server.close(() => process.exit(1));
// });
