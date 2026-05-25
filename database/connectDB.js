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

// Import and initialize database connection immediately
const connectDB = require("./database/connectDB");

// Start connection immediately (not waiting for request)
// Your connectDB function handles reuse and connection states
connectDB().catch(err => {
  console.error("Initial database connection failed:", err);
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
  app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
  });
}

module.exports = app;