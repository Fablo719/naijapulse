const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require('cors');
const dotenv = require("dotenv");
dotenv.config();

app.set("view engine", 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50Mb" }));
app.use(cors());

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

// Database connection function
const connectDB = require("./database/connectDB");

// Connect to database BEFORE the app is exported
// This ensures database is connected when Vercel starts the function
let dbConnection = null;

const initializeDatabase = async () => {
  if (!dbConnection) {
    try {
      dbConnection = await connectDB();
      console.log("✅ Database connected successfully");
    } catch (error) {
      console.error("❌ Failed to connect to DB:", error.message);
      // Don't throw - let the app still respond to requests
      // but database queries will fail
    }
  }
  return dbConnection;
};

// Initialize database connection
initializeDatabase();

// For local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server started successfully on port ${PORT}`);
    // Ensure database is connected
    initializeDatabase();
  });
}

// Export for Vercel (database connection will be established when function is called)
module.exports = app;