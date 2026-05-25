const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./database/connectDB");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50Mb" }));
app.use(cors());

app.set("view engine", "ejs");

// Routes
const UserRouter = require("./routers/user.routes");
const PostRouter = require("./routers/post.routes");
const ProfileRouter = require("./routers/profile.routes");

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/posts", PostRouter);
app.use("/api/v1", ProfileRouter);

// Connect DB (important)
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

module.exports = app;