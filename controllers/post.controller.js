const Post = require("../models/post.model");
const User = require("../models/user.model");
const connectDB = require("../database/connectDB");

// -------------------- CREATE POST --------------------
const createPost = async (req, res) => {
  await connectDB();
  try {
    const { postTitle, postContent, postCategory, postImage } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const newPost = new Post({
      postTitle,
      postContent,
      postCategory,
      postImage,
      authorId: user._id,
      authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Anonymous",
      authorEmail: user.email
    });

    await newPost.save();

    res.status(201).json({ success: true, message: "Post added successfully", post: newPost });
  } catch (error) {
    console.log("Create post error:", error);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
};

// -------------------- GET ALL POSTS --------------------
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "firstName lastName email") // 🔥 FIX HERE
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// -------------------- GET USER POSTS --------------------
const getUserPosts = async (req, res) => {
  await connectDB();
  try {
    const { userId } = req.params;
    const posts = await Post.find({ authorId: userId, isPublic: true }).sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- ADD COMMENT --------------------
const addComment = async (req, res) => {
  await connectDB();
  try {
    const { comment } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newComment = {
      userId: user._id,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Anonymous",
      comment,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    res.json({ success: true, comments: post.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- LIKE COMMENT --------------------
const likeComment = async (req, res) => {
  await connectDB();
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    const userId = req.user.id;

    const likedIndex = comment.likes.findIndex(
      id => id.toString() === userId
    );

    let isLiked = false;

    if (likedIndex === -1) {
      comment.likes.push(userId);
      isLiked = true;
    } else {
      comment.likes.splice(likedIndex, 1);
    }

    await post.save();

    res.status(200).json({
      success: true,
      likes: comment.likes.length,
      isLiked
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// -------------------- DELETE COMMENT --------------------
const deleteComment = async (req, res) => {
  await connectDB();
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    const isCommentOwner = comment.userId.toString() === req.user.id;
    const isPostOwner = post.authorId.toString() === req.user.id;

    if (!isCommentOwner && !isPostOwner && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    post.comments.pull(commentId);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// -------------------- LIKE / UNLIKE POST --------------------
const likePost = async (req, res) => {
  await connectDB();
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likedIndex = post.likes.findIndex(
      id => id.toString() === req.user.id
    );

    let isLiked = false;

    if (likedIndex === -1) {
      post.likes.push(req.user.id);
      isLiked = true;
    } else {
      post.likes.splice(likedIndex, 1);
    }

    await post.save();

    res.json({
      success: true,
      likes: post.likes.length,
      isLiked
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// -------------------- UPDATE POST --------------------
const updatePost = async (req, res) => {
  await connectDB();
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.authorId.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    post.postTitle = req.body.postTitle || post.postTitle;
    post.postContent = req.body.postContent || post.postContent;

    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- DELETE POST --------------------
const deletePost = async (req, res) => {
  await connectDB();
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.authorId.toString() !== req.user.id && !req.user.isAdmin) return res.status(403).json({ message: "Not authorized" });

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- SAVE / UNSAVE POST (COMMENTED) --------------------
// const savePost = async (req, res) => {
//   await connectDB();
//   try {
//     const userId = req.user.id;
//     const { postId } = req.params;

//     const post = await Post.findById(postId);
//     const user = await User.findById(userId);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     const alreadySaved = post.savedBy.includes(userId);
//     if (alreadySaved) {
//       post.savedBy = post.savedBy.filter(id => id.toString() !== userId);
//       user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
//     } else {
//       post.savedBy.push(userId);
//       user.savedPosts.push(postId);
//     }

//     await post.save();
//     await user.save();

//     res.json({ success: true, saved: !alreadySaved });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // -------------------- GET SAVED POSTS (COMMENTED) --------------------
// const getSavedPosts = async (req, res) => {
//   await connectDB();
//   try {
//     const user = await User.findById(req.user.id).populate("savedPosts");
//     res.json({ success: true, posts: user.savedPosts });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // -------------------- SEARCH POSTS (COMMENTED) --------------------
// const searchPosts = async (req, res) => {
//   await connectDB();
//   try {
//     const { q } = req.query;
//     const posts = await Post.find({
//       $or: [
//         { postTitle: { $regex: q, $options: 'i' } },
//         { postContent: { $regex: q, $options: 'i' } }
//       ],
//       isPublic: true
//     }).sort({ createdAt: -1 });

//     res.json({ success: true, posts });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // -------------------- SHARE POST (COMMENTED) --------------------
// const sharePost = async (req, res) => {
//   await connectDB();
//   try {
//     const post = await Post.findById(req.params.postId);
//     if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

//     post.shares += 1;
//     await post.save();
//     res.json({ success: true, shares: post.shares });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
const getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "firstName lastName email");

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// -------------------- GET USER RESPONSES --------------------
const getUserResponses = async (req, res) => {
  await connectDB();
  try {
    const posts = await Post.find({ "comments.userId": req.user.id });
    const responses = [];

    posts.forEach(post => {
      post.comments.forEach(comment => {
        if (comment.userId.toString() === req.user.id) {
          responses.push({
            postId: post._id,
            postTitle: post.postTitle,
            comment: comment.comment,
            createdAt: comment.createdAt
          });
        }
      });
    });

    res.status(200).json(responses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- EXPORT ALL FUNCTIONS --------------------
module.exports = {
  createPost,
  getAllPosts,
  getUserPosts,
  addComment,
  likeComment,
  deleteComment,
  likePost,
  updatePost,
  deletePost,
 
  getSinglePost,
  getUserResponses
};