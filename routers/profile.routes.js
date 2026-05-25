const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user.model');

// Get user profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/:userId', auth, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { name, bio, avatar },
      { new: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;