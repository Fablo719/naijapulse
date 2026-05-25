const express = require("express");
const app = express();
const cors = require('cors');
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./database/connectDB");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// Routes
const UserRouter = require('./routers/user.routes');
const PostRouter = require('./routers/post.routes');
const ProfileRouter = require('./routers/profile.routes');

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

app.use('/api/v1/users', UserRouter);
app.use('/api/v1/posts', PostRouter);
app.use('/api/v1', ProfileRouter);

// Connect DB always, then start server locally
connectDB();

if (process.env.NODE_ENV !== 'production') {
  app.listen(process.env.PORT || 5008, () => {
    console.log('Server started successfully');
  });
}

module.exports = app;