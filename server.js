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
const ProfileRouter = require('./routers/profile.routes')

const connectDB = require("./database/connectDB");
app.use('/api/v1/users', UserRouter);
app.use('/api/v1/posts', PostRouter);
app.use('/api/v1', ProfileRouter);


// const DATABASE_URL = process.env.DATABASE_URI || process.env.MONGODB_URL;
// console.log("Attempting to connect to MongoDB...");

// mongoose.connect(DATABASE_URL)
//     .then(() => {
//         console.log("✅ Database connected successfully");
//     })
//     .catch((error) => {
//         console.log("❌ Failed to connect to DB");
//         console.log("Error details:", error.message);
//     });


app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(process.env.PORT, (err) => {
      if (err) {
        console.log('error starting server');
      } else {
        console.log('server started successfully');
      }
    });
  });
}

module.exports = app;