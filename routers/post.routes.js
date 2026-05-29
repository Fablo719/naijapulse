const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  createPost,
  getAllPosts,
  getUserPosts,
  addComment,
  likeComment,
  deleteComment,
  likePost,
  updatePost,
  deletePost,
  savePost,
  getSavedPosts,
  searchPosts,
  sharePost,
  getUserResponses
} = require("../controllers/post.controller");

// ADMIN
router.get("/admin/posts", auth, admin, getAllPosts);

router.post("/createPost", auth, createPost);
router.get("/getAllPosts", auth, getAllPosts);


router.put("/:postId", auth, updatePost);
router.delete("/admin/post/:postId", auth, admin, deletePost);

router.post("/:postId/comment/:commentId/like", auth, likeComment);
// Add this line - allows users to delete their own posts
router.delete("/:postId", auth, deletePost);  // Users can delete their own posts


router.delete(  "/:postId/comment/:commentId",  auth,deleteComment);

  

router.get("/user/:userId", auth, getUserPosts);

router.get("/search", auth, searchPosts);
router.post("/:postId/save", auth, savePost);
router.get("/saved/posts", auth, getSavedPosts);
router.get("/responses/me", auth, getUserResponses);


router.post("/:postId/like", auth, likePost);
router.post("/:postId/comment", auth, addComment);
router.post("/:postId/share", auth, sharePost);

module.exports = router;