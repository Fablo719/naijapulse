const express = require('express');
const router = express.Router();

const {
  createUser,
  editUser,
  getAllUsers,
  deleteUser,
  login,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/user.controller');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/user.model'); // make sure this path is correct

// =======================
// PUBLIC ROUTES
// =======================
router.post('/register', createUser);
router.post('/login', login);

// =======================
// USER ROUTES (PROTECTED)
// =======================
router.get('/me', auth, getMe);
router.patch('/edituser/:id', auth, editUser);
router.get('/getUsers', auth, getAllUsers);
router.delete('/deleteUser/:id', auth, deleteUser);

// =======================
// ADMIN ROUTES
// =======================

// Get all users (admin)
router.get('/admin/users', auth, admin, getAllUsers);

// Delete user (admin)
router.delete('/admin/user/:id', auth, admin, deleteUser);

// Password reset routes (no authentication required)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ✅ UPDATE USER ROLE (FIXED ROUTE)
router.put('/updateUserRole/:id', auth, admin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: error.message
    });
  }
});

module.exports = router;