const express = require("express");
const app = express();
const cors = require('cors');
const dotenv = require("dotenv");
dotenv.config();

app.set("view engine", 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50Mb" }));
app.use(cors());

// Import connectDB
const connectDB = require("./database/connectDB");

// Middleware to ensure database is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDB(); // This will reuse existing connection
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ 
      error: "Database connection failed",
      message: error.message 
    });
  }
});

// Routes
const UserRouter = require('./routers/user.routes');
const PostRouter = require('./routers/post.routes');
const ProfileRouter = require('./routers/profile.routes');

app.use('/api/v1/users', UserRouter);
app.use('/api/v1/posts', PostRouter);
app.use('/api/v1', ProfileRouter);

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// For local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server started successfully on port ${PORT}`);
    });
  }).catch(err => {
    console.error("Failed to connect to database on startup:", err);
  });
}

module.exports = app;